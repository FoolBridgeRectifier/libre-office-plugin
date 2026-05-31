import { Plugin } from 'obsidian';
import type { WorkspaceLeaf } from 'obsidian';

import { EditorView } from './editor-view/EditorView';
import {
  detachLibreMarkdownLeaves,
  openFileInNativeMarkdownView,
  registerLibreMarkdownRouting,
  routeMostRecentMarkdownLeafToLibreEditor,
  routeOpenMarkdownLeavesToLibreEditor,
  routeWorkspaceLeafToLibreEditor,
  shouldRouteFileToLibreEditor,
} from './editor-view/helpers';
import {
  OPEN_NATIVE_MARKDOWN_COMMAND_ID,
  OPEN_NATIVE_MARKDOWN_COMMAND_NAME,
} from './editor-view/constants';
import '../styles.css';

// Obsidian plugins are inheritance-based, so this wrapper stays as a class.
export default class LibreNoteEditorPlugin extends Plugin {
  private nativeFallbackLeaves = new WeakSet<WorkspaceLeaf>();

  onload(): void {
    registerLibreMarkdownRouting(this, (workspaceLeaf) => new EditorView(workspaceLeaf));
    this.registerNativeMarkdownFallbackCommand();
    this.registerMarkdownRoutingEvents();

    this.app.workspace.onLayoutReady(() => {
      void routeOpenMarkdownLeavesToLibreEditor(this.app.workspace);
    });
  }

  onunload(): void {
    detachLibreMarkdownLeaves(this.app.workspace);
  }

  private registerNativeMarkdownFallbackCommand() {
    this.addCommand({
      checkCallback: (checking) => {
        const activeFile = this.app.workspace.getActiveFile();
        const navigationLeaf = this.app.workspace.getLeaf(false);
        const canOpenNativeMarkdown = shouldRouteFileToLibreEditor(activeFile);

        if (checking || !canOpenNativeMarkdown) {
          return canOpenNativeMarkdown;
        }

        this.nativeFallbackLeaves.add(navigationLeaf);
        void openFileInNativeMarkdownView(navigationLeaf, activeFile);

        return true;
      },
      id: OPEN_NATIVE_MARKDOWN_COMMAND_ID,
      name: OPEN_NATIVE_MARKDOWN_COMMAND_NAME,
    });
  }

  private registerMarkdownRoutingEvents() {
    this.registerEvent(
      this.app.workspace.on('file-open', (file) => {
        const navigationLeaf = this.app.workspace.getMostRecentLeaf();

        if (this.shouldSkipMarkdownRouting(navigationLeaf)) {
          return;
        }

        void routeMostRecentMarkdownLeafToLibreEditor(this.app.workspace, file);
      })
    );

    this.registerEvent(
      this.app.workspace.on('active-leaf-change', (workspaceLeaf) => {
        if (this.shouldSkipMarkdownRouting(workspaceLeaf)) {
          return;
        }

        void routeWorkspaceLeafToLibreEditor(workspaceLeaf);
      })
    );
  }

  private shouldSkipMarkdownRouting(workspaceLeaf: WorkspaceLeaf | null) {
    return workspaceLeaf !== null && this.nativeFallbackLeaves.has(workspaceLeaf);
  }
}
