import { FileView } from 'obsidian';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import type { TFile, ViewStateResult, WorkspaceLeaf } from 'obsidian';

import { App } from '../App';
import { LIBRE_MARKDOWN_VIEW_TYPE } from './constants';
import { shouldRouteFileToLibreEditor } from './helpers';

export class EditorView extends FileView {
  // FileView can be restored before Obsidian has assigned a file.
  allowNoFile = true;
  private activeMarkdownFile: TFile | null = null;
  private reactRoot: Root | null = null;

  constructor(workspaceLeaf: WorkspaceLeaf) {
    super(workspaceLeaf);
    // Navigation keeps this custom view in normal pane history.
    this.navigation = true;
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
    // Obsidian calls this after the leaf switches to a concrete TFile.
    this.activeMarkdownFile = file;
    this.renderReactApp();
  }

  async onRename(file: TFile): Promise<void> {
    // Keep the React status line aligned when Obsidian renames the open note.
    if (this.activeMarkdownFile?.path === file.path) {
      this.activeMarkdownFile = file;
      this.renderReactApp();
    }
  }

  async onUnloadFile(_file: TFile): Promise<void> {
    // A file can unload while the pane remains open, so keep the shell mounted.
    this.activeMarkdownFile = null;
    this.renderReactApp();
  }

  async setState(state: unknown, result: ViewStateResult): Promise<void> {
    // Restored workspace state may arrive before or after onOpen.
    await super.setState(state, result);
    this.renderReactApp();
  }

  protected async onOpen(): Promise<void> {
    // Create exactly one React root for this Obsidian leaf.
    this.contentEl.empty();
    this.reactRoot = createRoot(this.contentEl);
    this.renderReactApp();
  }

  protected async onClose(): Promise<void> {
    // Unmount before clearing content so React can release handlers cleanly.
    this.reactRoot?.unmount();
    this.reactRoot = null;
    this.contentEl.empty();
  }

  private renderReactApp() {
    // Only surface markdown paths until rich document state exists.
    const activeFilePath = shouldRouteFileToLibreEditor(this.activeMarkdownFile)
      ? this.activeMarkdownFile.path
      : null;

    this.reactRoot?.render(createElement(App, { activeFilePath }));
  }
}
