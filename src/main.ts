import { ItemView, Plugin } from 'obsidian';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import type { WorkspaceLeaf } from 'obsidian';

import { App } from './App';
import '../styles.css';

class ReactView extends ItemView {
  private reactRoot: Root | null = null;

  getViewType(): string {
    return 'libre-note-editor-view';
  }

  getDisplayText(): string {
    return 'Libre Note Editor';
  }

  protected async onOpen(): Promise<void> {
    this.contentEl.empty();
    this.reactRoot = createRoot(this.contentEl);
    this.reactRoot.render(createElement(App));
  }

  protected async onClose(): Promise<void> {
    this.reactRoot?.unmount();
    this.reactRoot = null;
    this.contentEl.empty();
  }
}

export default class LibreNoteEditorPlugin extends Plugin {
  onload(): void {
    this.registerView(
      'libre-note-editor-view',
      (workspaceLeaf: WorkspaceLeaf) => new ReactView(workspaceLeaf)
    );
  }

  onunload(): void {
    this.app.workspace.detachLeavesOfType('libre-note-editor-view');
  }
}
