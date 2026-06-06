import { FileView } from 'obsidian';
import { createRoot, type Root } from 'react-dom/client';

import type { TFile, ViewStateResult, WorkspaceLeaf } from 'obsidian';

import { LIBRE_MARKDOWN_VIEW_TYPE } from './constants';
import { createEditorViewAutosaveController } from './helpers';
import { renderEditorViewAppElement } from './helpers/app-element/appElement';
import {
  refreshEditorViewDesktopSourceAfterLoad,
  syncEditorViewDesktopSource,
} from './helpers/desktop-source/desktopSource';
import { resolveEditorViewConflict } from './helpers/conflict/conflict';
import {
  applyEditorViewLoadedState,
  applyEditorViewUnloadedState,
  applyEditorViewHtmlSourceChange,
  getEditorViewLinkWarningCount,
  loadEditorViewLoadedState,
  setEditorViewAutosaveDocument,
  startEditorViewHtmlLoad,
} from './helpers/state/state';
import { createSkippedMobileRuntimeSetupState } from '../office-runtime/helpers/setup-state/setupState';
import type { AutosaveController, AutosaveStatus } from '../autosave/interfaces';
import type { ConflictResolutionChoice } from '../conflicts/interfaces';
import type { EditorViewOptions } from './interfaces';
import type { OfficeRuntimeSetupState } from '../office-runtime/interfaces';

export class EditorView extends FileView {
  allowNoFile = true;
  autosaveStatus: AutosaveStatus = 'saved';
  desktopSourceStatus: 'idle' | 'loading' | 'error' = 'idle';
  importedHtmlSource: string | null = null;
  isResolvingConflict = false;
  linkWarningCount = 0;
  officeRuntimeSetupState: OfficeRuntimeSetupState;
  activeMarkdownFile: TFile | null = null;
  showHtmlEmptyState = false;
  readonly autosaveController: AutosaveController;
  private reactRoot: Root | null = null;
  readonly editorViewOptions: EditorViewOptions;

  constructor(workspaceLeaf: WorkspaceLeaf, editorViewOptions: EditorViewOptions) {
    super(workspaceLeaf);

    this.navigation = true;
    this.editorViewOptions = editorViewOptions;
    this.officeRuntimeSetupState =
      editorViewOptions.getOfficeRuntimeSetupState?.() ?? createSkippedMobileRuntimeSetupState();

    this.autosaveController = createEditorViewAutosaveController(
      editorViewOptions,
      (autosaveStatus) => {
        this.autosaveStatus = autosaveStatus;
        this.renderReactApp();
      }
    );
  }

  canAcceptExtension(extension: string): boolean {
    return extension.toLowerCase() === 'md';
  }
  getDisplayText(): string {
    return this.activeMarkdownFile?.basename ?? 'Libre Note Editor';
  }
  getState(): Record<string, unknown> {
    return { file: this.activeMarkdownFile?.path ?? null };
  }
  getViewType(): string {
    return LIBRE_MARKDOWN_VIEW_TYPE;
  }
  async onLoadFile(file: TFile): Promise<void> {
    const shouldClearActiveDocument = startEditorViewHtmlLoad(this, file);

    if (shouldClearActiveDocument) {
      await this.autosaveController.clearActiveDocument();
    }

    const loadedState = await loadEditorViewLoadedState(this.editorViewOptions, file);

    applyEditorViewLoadedState(this, loadedState);

    setEditorViewAutosaveDocument(this.autosaveController, file, this.importedHtmlSource);
    this.autosaveStatus = loadedState.autosaveStatus;
    this.renderReactApp();
    void refreshEditorViewDesktopSourceAfterLoad(this, file);
  }
  async onRename(file: TFile): Promise<void> {
    if (this.activeMarkdownFile?.path === file.path) {
      await this.onLoadFile(file);
    }
  }
  async onUnloadFile(_file: TFile): Promise<void> {
    await this.autosaveController.clearActiveDocument();

    applyEditorViewUnloadedState(this);
  }
  flushPendingAutosave = async (): Promise<void> => {
    await this.autosaveController.flushAll();
  };
  refreshLinkWarnings(): void {
    if (!this.activeMarkdownFile || this.importedHtmlSource === null) {
      return;
    }

    this.linkWarningCount = getEditorViewLinkWarningCount(
      this.editorViewOptions,
      this.activeMarkdownFile,
      this.importedHtmlSource
    );

    this.renderReactApp();
  }
  async setState(state: unknown, result: ViewStateResult): Promise<void> {
    await super.setState(state, result);
    this.renderReactApp();
  }
  protected async onOpen(): Promise<void> {
    this.contentEl.empty();
    this.reactRoot = createRoot(this.contentEl);
    this.renderReactApp();
  }
  protected async onClose(): Promise<void> {
    await this.autosaveController.clearActiveDocument();
    this.reactRoot?.unmount();
    this.reactRoot = null;
    this.contentEl.empty();
  }
  handleEditorBlur = () => void syncEditorViewDesktopSource(this);
  handleHtmlSourceChange = (htmlSource: string) =>
    applyEditorViewHtmlSourceChange(this, htmlSource);
  handleResolveConflict = async (choice: ConflictResolutionChoice) => {
    const result = await resolveEditorViewConflict(this, choice);

    if (result === null) {
      return;
    }

    this.autosaveStatus = result.autosaveStatus;
    this.importedHtmlSource = result.htmlSource;
    this.linkWarningCount = result.linkWarningCount;
    this.renderReactApp();
  };
  renderReactApp = () => renderEditorViewAppElement(this.reactRoot, this);
}
