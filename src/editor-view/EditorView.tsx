import { FileView } from 'obsidian';
import { createRoot, type Root } from 'react-dom/client';

import type { TFile, ViewStateResult, WorkspaceLeaf } from 'obsidian';

import { LIBRE_MARKDOWN_VIEW_TYPE } from './constants';
import { createEditorViewAutosaveController } from './helpers';
import { createEditorViewAppElement } from './helpers/app-element/appElement';
import {
  getEditorViewLinkWarningCount,
  loadEditorViewLoadedState,
  setEditorViewAutosaveDocument,
} from './helpers/state/state';
import type { AutosaveController, AutosaveStatus } from '../autosave/interfaces';
import type { EditorViewOptions } from './interfaces';

export class EditorView extends FileView {
  allowNoFile = true;
  private activeMarkdownFile: TFile | null = null;
  private autosaveStatus: AutosaveStatus = 'saved';
  private readonly autosaveController: AutosaveController;
  private importedHtmlSource: string | null = null;
  private linkWarningCount = 0;
  private reactRoot: Root | null = null;
  private readonly editorViewOptions: EditorViewOptions;

  constructor(workspaceLeaf: WorkspaceLeaf, editorViewOptions: EditorViewOptions) {
    super(workspaceLeaf);

    this.navigation = true;
    this.editorViewOptions = editorViewOptions;

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
    if (this.activeMarkdownFile?.path !== file.path) {
      await this.autosaveController.clearActiveDocument();
    }

    this.activeMarkdownFile = file;

    const loadedState = await loadEditorViewLoadedState(this.editorViewOptions, file);
    this.importedHtmlSource = loadedState.htmlSource;
    this.linkWarningCount = loadedState.linkWarningCount;

    setEditorViewAutosaveDocument(this.autosaveController, file, this.importedHtmlSource);
    this.renderReactApp();
  }
  async onRename(file: TFile): Promise<void> {
    if (this.activeMarkdownFile?.path === file.path) {
      const loadedState = await loadEditorViewLoadedState(this.editorViewOptions, file);

      this.activeMarkdownFile = file;
      this.importedHtmlSource = loadedState.htmlSource;
      this.linkWarningCount = loadedState.linkWarningCount;

      setEditorViewAutosaveDocument(this.autosaveController, file, this.importedHtmlSource);
      this.renderReactApp();
    }
  }
  async onUnloadFile(_file: TFile): Promise<void> {
    await this.autosaveController.clearActiveDocument();

    this.activeMarkdownFile = null;
    this.importedHtmlSource = null;
    this.linkWarningCount = 0;
    this.renderReactApp();
  }
  async flushPendingAutosave(): Promise<void> {
    await this.autosaveController.flushAll();
  }
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
  private handleEditorBlur = () => {
    void this.autosaveController.flushAll();
  };
  private handleHtmlSourceChange = (htmlSource: string) => {
    this.importedHtmlSource = htmlSource;

    if (this.activeMarkdownFile) {
      this.linkWarningCount = getEditorViewLinkWarningCount(
        this.editorViewOptions,
        this.activeMarkdownFile,
        htmlSource
      );
    }

    this.autosaveController.handleHtmlSourceChange(htmlSource);
  };

  private renderReactApp() {
    this.reactRoot?.render(
      createEditorViewAppElement(
        this.activeMarkdownFile,
        this.autosaveStatus,
        this.importedHtmlSource,
        this.linkWarningCount,
        this.handleEditorBlur,
        this.handleHtmlSourceChange
      )
    );
  }
}
