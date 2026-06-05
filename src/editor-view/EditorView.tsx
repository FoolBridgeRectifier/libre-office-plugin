import { FileView } from 'obsidian';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import type { TFile, ViewStateResult, WorkspaceLeaf } from 'obsidian';

import { App } from '../App';
import { LIBRE_MARKDOWN_VIEW_TYPE } from './constants';
import { createEditorViewAutosaveController, shouldRouteFileToLibreEditor } from './helpers';
import type { AutosaveController, AutosaveStatus } from '../autosave/interfaces';
import type { EditorViewOptions } from './interfaces';

export class EditorView extends FileView {
  allowNoFile = true;
  private activeMarkdownFile: TFile | null = null;
  private autosaveStatus: AutosaveStatus = 'saved';
  private readonly autosaveController: AutosaveController;
  private importedHtmlSource: string | null = null;
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
    return {
      file: this.activeMarkdownFile?.path ?? null,
    };
  }

  getViewType(): string {
    return LIBRE_MARKDOWN_VIEW_TYPE;
  }

  async onLoadFile(file: TFile): Promise<void> {
    if (this.activeMarkdownFile?.path !== file.path) {
      await this.autosaveController.clearActiveDocument();
    }

    this.activeMarkdownFile = file;

    this.importedHtmlSource = await this.loadImportedHtmlSource(file);
    this.setAutosaveDocument(file, this.importedHtmlSource);
    this.renderReactApp();
  }

  async onRename(file: TFile): Promise<void> {
    if (this.activeMarkdownFile?.path === file.path) {
      this.activeMarkdownFile = file;
      this.importedHtmlSource = await this.loadImportedHtmlSource(file);
      this.setAutosaveDocument(file, this.importedHtmlSource);
      this.renderReactApp();
    }
  }

  async onUnloadFile(_file: TFile): Promise<void> {
    await this.autosaveController.clearActiveDocument();

    this.activeMarkdownFile = null;
    this.importedHtmlSource = null;
    this.renderReactApp();
  }

  async flushPendingAutosave(): Promise<void> {
    await this.autosaveController.flushAll();
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

  private async loadImportedHtmlSource(file: TFile) {
    if (!shouldRouteFileToLibreEditor(file)) {
      return null;
    }

    return this.editorViewOptions.loadImportedHtmlSource(file);
  }

  private setAutosaveDocument(file: TFile, htmlSource: string | null): void {
    if (htmlSource === null) {
      this.autosaveController.setActiveDocument(null);
      return;
    }

    this.autosaveController.setActiveDocument({ htmlSource, markdownPath: file.path });
  }

  private handleEditorBlur = () => {
    void this.autosaveController.flushAll();
  };

  private handleHtmlSourceChange = (htmlSource: string) => {
    this.importedHtmlSource = htmlSource;
    this.autosaveController.handleHtmlSourceChange(htmlSource);
  };

  private renderReactApp() {
    const activeFilePath = shouldRouteFileToLibreEditor(this.activeMarkdownFile)
      ? this.activeMarkdownFile.path
      : null;

    this.reactRoot?.render(
      createElement(App, {
        activeFilePath,
        autosaveStatus: this.autosaveStatus,
        importedHtmlSource: this.importedHtmlSource,
        onEditorBlur: this.handleEditorBlur,
        onHtmlSourceChange: this.handleHtmlSourceChange,
      })
    );
  }
}
