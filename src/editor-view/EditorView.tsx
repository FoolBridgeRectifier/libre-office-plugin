import { FileView } from 'obsidian';
import type { Root } from 'react-dom/client';

import type { TFile, ViewStateResult, WorkspaceLeaf } from 'obsidian';

import { LIBRE_MARKDOWN_VIEW_TYPE } from './constants';
import { createEditorViewAutosaveController } from './autosave-controller/autosaveController';
import { createEditorViewRoot, renderEditorViewAppElement } from './app-element/appElement';
import {
  applyEditorViewConflictResolutionResult,
  resolveEditorViewConflict,
} from './conflict/conflict';
import {
  applyEditorViewLoadedState,
  applyEditorViewUnloadedState,
  applyEditorViewHtmlSourceChange,
  loadEditorViewLoadedState,
  refreshEditorViewLinkWarnings,
  refreshEditorViewSettingsState,
  setEditorViewAutosaveDocument,
  startEditorViewHtmlLoad,
} from './state/state';
import * as editorViewNavigation from './navigation/navigation';
import type { AutosaveController, AutosaveStatus } from '../autosave/interfaces';
import type { ConflictResolutionChoice } from '../conflicts/interfaces';
import type { EditorViewOptions, EditorViewRenderTarget } from './interfaces';

export class EditorView extends FileView {
  allowNoFile = true;
  autosaveStatus: AutosaveStatus = 'saved';
  importedHtmlSource: string | null = null;
  isResolvingConflict = false;
  linkWarningCount = 0;
  pageLayout: EditorViewRenderTarget['pageLayout'] = 'pageless';
  activeMarkdownFile: TFile | null = null;
  showHtmlEmptyState = false;
  readonly autosaveController: AutosaveController;
  private reactRoot: Root | null = null;
  readonly editorViewOptions: EditorViewOptions;

  constructor(workspaceLeaf: WorkspaceLeaf, editorViewOptions: EditorViewOptions) {
    super(workspaceLeaf);

    this.navigation = true;
    this.editorViewOptions = editorViewOptions;

    refreshEditorViewSettingsState(this);

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
    refreshEditorViewLinkWarnings(this);
  }
  async setState(state: unknown, result: ViewStateResult): Promise<void> {
    await super.setState(state, result);
    this.renderReactApp();
  }
  protected async onOpen(): Promise<void> {
    this.contentEl.empty();
    this.reactRoot = createEditorViewRoot(this.contentEl);
    this.renderReactApp();
  }
  protected async onClose(): Promise<void> {
    await this.autosaveController.clearActiveDocument();
    this.reactRoot?.unmount();
    this.reactRoot = null;
    this.contentEl.empty();
  }
  handleEditorBlur = () => void this.autosaveController.flushHtml();
  handleExternalLinkNavigate = (url: string) =>
    editorViewNavigation.navigateEditorViewExternalLink(this, url);
  handleHtmlSourceChange = (htmlSource: string) =>
    applyEditorViewHtmlSourceChange(this, htmlSource);
  handleInternalLinkNavigate = (target: string) =>
    editorViewNavigation.navigateEditorViewInternalLink(this, target);
  handleResolveConflict = async (choice: ConflictResolutionChoice) => {
    const result = await resolveEditorViewConflict(this, choice);

    applyEditorViewConflictResolutionResult(this, result);
  };
  handleTagNavigate = (tagText: string) =>
    editorViewNavigation.navigateEditorViewTag(this, tagText);
  renderReactApp = () => {
    refreshEditorViewSettingsState(this);
    renderEditorViewAppElement(this.reactRoot, this);
  };
}
