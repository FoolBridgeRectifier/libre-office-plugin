import { Plugin } from 'obsidian';
import type { TFile, WorkspaceLeaf } from 'obsidian';

import { EditorView } from './editor-view/EditorView';
import {
  detachLibreMarkdownLeaves,
  getWorkspaceLeafFile,
  openFileInNativeMarkdownView,
  registerLibreMarkdownRouting,
  routeMostRecentMarkdownLeafToLibreEditor,
  routeOpenMarkdownLeavesToLibreEditor,
  routeWorkspaceLeafToLibreEditor,
  shouldRouteFileToLibreEditor,
  shouldRoutePathToLibreEditor,
} from './editor-view/helpers';
import {
  OPEN_NATIVE_MARKDOWN_COMMAND_ID,
  OPEN_NATIVE_MARKDOWN_COMMAND_NAME,
} from './editor-view/constants';
import { createRichDocumentStore } from './rich-documents/richDocuments';
import type { RichDocumentStore } from './rich-documents/interfaces';
import '../styles.css';

// Obsidian plugins are inheritance-based, so this wrapper stays as a class.
export default class LibreNoteEditorPlugin extends Plugin {
  private nativeFallbackLeaves = new WeakSet<WorkspaceLeaf>();
  private richDocumentStore: RichDocumentStore | null = null;

  async onload(): Promise<void> {
    this.richDocumentStore = createRichDocumentStore({
      lastEditorPlatform: 'desktop',
      persistenceTarget: this,
      vaultAdapter: this.app.vault.adapter,
    });

    await this.richDocumentStore.loadMappings();

    registerLibreMarkdownRouting(this, (workspaceLeaf) => new EditorView(workspaceLeaf));
    this.registerNativeMarkdownFallbackCommand();
    this.registerMarkdownRoutingEvents();
    this.registerRichDocumentMappingEvents();

    this.app.workspace.onLayoutReady(() => {
      this.ensureMappingsForOpenMarkdownLeaves();
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

        void this.ensureRichDocumentMapping(file);
        void routeMostRecentMarkdownLeafToLibreEditor(this.app.workspace, file);
      })
    );

    this.registerEvent(
      this.app.workspace.on('active-leaf-change', (workspaceLeaf) => {
        if (!workspaceLeaf || this.shouldSkipMarkdownRouting(workspaceLeaf)) {
          return;
        }

        void this.ensureRichDocumentMapping(getWorkspaceLeafFile(workspaceLeaf));
        void routeWorkspaceLeafToLibreEditor(workspaceLeaf);
      })
    );
  }

  private registerRichDocumentMappingEvents() {
    this.registerEvent(
      this.app.vault.on('rename', (file, previousPath) => {
        if (shouldRoutePathToLibreEditor(file.path)) {
          void this.richDocumentStore?.renameMapping(previousPath, file.path);
          return;
        }

        if (shouldRoutePathToLibreEditor(previousPath)) {
          void this.richDocumentStore?.archiveMapping(previousPath);
        }
      })
    );

    this.registerEvent(
      this.app.vault.on('delete', (file) => {
        if (shouldRoutePathToLibreEditor(file.path)) {
          void this.richDocumentStore?.deleteMapping(file.path);
        }
      })
    );
  }

  private ensureMappingsForOpenMarkdownLeaves() {
    this.app.workspace.iterateAllLeaves((workspaceLeaf) => {
      void this.ensureRichDocumentMapping(getWorkspaceLeafFile(workspaceLeaf));
    });
  }

  private async ensureRichDocumentMapping(file: TFile | null) {
    // Mapping creation is queued by the store so multiple leaves share one record.
    if (!shouldRouteFileToLibreEditor(file)) {
      return;
    }

    await this.richDocumentStore?.getOrCreateMapping(file.path);
  }

  private shouldSkipMarkdownRouting(workspaceLeaf: WorkspaceLeaf | null) {
    return workspaceLeaf !== null && this.nativeFallbackLeaves.has(workspaceLeaf);
  }
}
