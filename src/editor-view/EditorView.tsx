import { FileView } from 'obsidian';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import type { TFile, ViewStateResult, WorkspaceLeaf } from 'obsidian';

import { App } from '../App';
import { LIBRE_MARKDOWN_VIEW_TYPE } from './constants';
import { shouldRouteFileToLibreEditor } from './helpers';
import type { EditorViewOptions } from './interfaces';

// Obsidian custom views must extend FileView; React remains functional inside it.
export class EditorView extends FileView {
  // Obsidian may restore the pane before it has attached a concrete vault file.
  allowNoFile = true;
  private activeMarkdownFile: TFile | null = null;
  private importedHtmlSource: string | null = null;
  private reactRoot: Root | null = null;
  private readonly editorViewOptions: EditorViewOptions;

  constructor(workspaceLeaf: WorkspaceLeaf, editorViewOptions: EditorViewOptions) {
    super(workspaceLeaf);

    // Navigation keeps back/forward history working like a normal markdown tab.
    this.navigation = true;
    this.editorViewOptions = editorViewOptions;
  }

  canAcceptExtension(extension: string): boolean {
    // Obsidian asks this before loading a file into the view.
    return extension.toLowerCase() === 'md';
  }

  getDisplayText(): string {
    // This is the title Obsidian shows in the pane header and tab switcher.
    return this.activeMarkdownFile?.basename ?? 'Libre Note Editor';
  }

  getState(): Record<string, unknown> {
    // Workspace restoration stores the file path, not the full TFile object.
    return {
      file: this.activeMarkdownFile?.path ?? null,
    };
  }

  getViewType(): string {
    // The view type must match the value registered by the plugin in main.ts.
    return LIBRE_MARKDOWN_VIEW_TYPE;
  }

  async onLoadFile(file: TFile): Promise<void> {
    // Obsidian calls this after the leaf has resolved the workspace state into a TFile.
    this.activeMarkdownFile = file;

    // File IO stays in the plugin layer; the view only asks for display-ready HTML.
    this.importedHtmlSource = await this.loadImportedHtmlSource(file);
    this.renderReactApp();
  }

  async onRename(file: TFile): Promise<void> {
    // Obsidian emits rename events for the open file after the vault path changes.
    if (this.activeMarkdownFile?.path === file.path) {
      this.activeMarkdownFile = file;
      this.importedHtmlSource = await this.loadImportedHtmlSource(file);
      this.renderReactApp();
    }
  }

  async onUnloadFile(_file: TFile): Promise<void> {
    // The pane can survive after its file is closed, so React falls back to the empty shell.
    this.activeMarkdownFile = null;
    this.importedHtmlSource = null;
    this.renderReactApp();
  }

  async setState(state: unknown, result: ViewStateResult): Promise<void> {
    // Obsidian uses setState when restoring tabs or switching a leaf to our view type.
    await super.setState(state, result);
    this.renderReactApp();
  }

  protected async onOpen(): Promise<void> {
    // contentEl is Obsidian's container for this pane; React owns everything inside it.
    this.contentEl.empty();
    this.reactRoot = createRoot(this.contentEl);
    this.renderReactApp();
  }

  protected async onClose(): Promise<void> {
    // Obsidian can close panes without unloading the whole plugin, so clean up per-leaf React.
    this.reactRoot?.unmount();
    this.reactRoot = null;
    this.contentEl.empty();
  }

  private async loadImportedHtmlSource(file: TFile) {
    // Only markdown files get routed; sidebars and unsupported files should render no document.
    if (!shouldRouteFileToLibreEditor(file)) {
      return null;
    }

    // The importer is idempotent, so view reloads can safely ask for HTML again.
    return this.editorViewOptions.loadImportedHtmlSource(file);
  }

  private renderReactApp() {
    // React renders from plain data so it stays decoupled from Obsidian's FileView API.
    const activeFilePath = shouldRouteFileToLibreEditor(this.activeMarkdownFile)
      ? this.activeMarkdownFile.path
      : null;

    this.reactRoot?.render(
      createElement(App, { activeFilePath, importedHtmlSource: this.importedHtmlSource })
    );
  }
}
