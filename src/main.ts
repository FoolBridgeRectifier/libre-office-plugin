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
} from './editor-view/helpers';
import {
  OPEN_NATIVE_MARKDOWN_COMMAND_ID,
  OPEN_NATIVE_MARKDOWN_COMMAND_NAME,
} from './editor-view/constants';
import { registerRichDocumentMappingEvents } from './helpers';
import { ensureFirstMarkdownImport } from './markdown-sync/markdownSync';
import { renderMarkdownWithObsidian } from './markdown-sync/helpers';
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

    // Plugin data must be loaded before routing, otherwise open leaves could create duplicates.
    await this.richDocumentStore.loadMappings();

    // This registers the custom FileView factory Obsidian uses when a leaf has our view type.
    registerLibreMarkdownRouting(
      this,
      (workspaceLeaf) =>
        new EditorView(workspaceLeaf, {
          loadImportedHtmlSource: (file) => this.ensureRichDocumentHtml(file),
        })
    );

    this.registerNativeMarkdownFallbackCommand();
    this.registerMarkdownRoutingEvents();
    registerRichDocumentMappingEvents(this, this.richDocumentStore);

    // Layout readiness means the initial workspace leaves exist and can be inspected safely.
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

        // During command-palette checks, Obsidian only wants to know if the command is available.
        if (checking || !canOpenNativeMarkdown) {
          return canOpenNativeMarkdown;
        }

        // Mark this leaf before opening so our routing events do not immediately hijack it back.
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
        // file-open follows the most recent navigation target, not always a passed leaf.
        const navigationLeaf = this.app.workspace.getMostRecentLeaf();

        if (this.shouldSkipMarkdownRouting(navigationLeaf)) {
          return;
        }

        // HTML import can happen in parallel with leaf routing; the view reloads it when ready.
        void this.ensureRichDocumentHtml(file);
        void routeMostRecentMarkdownLeafToLibreEditor(this.app.workspace, file);
      })
    );

    this.registerEvent(
      this.app.workspace.on('active-leaf-change', (workspaceLeaf) => {
        if (!workspaceLeaf || this.shouldSkipMarkdownRouting(workspaceLeaf)) {
          return;
        }

        // A leaf is Obsidian's pane object; routing swaps its view type while preserving the file.
        void this.ensureRichDocumentHtml(getWorkspaceLeafFile(workspaceLeaf));
        void routeWorkspaceLeafToLibreEditor(workspaceLeaf);
      })
    );
  }

  private ensureMappingsForOpenMarkdownLeaves() {
    this.app.workspace.iterateAllLeaves((workspaceLeaf) => {
      void this.ensureRichDocumentHtml(getWorkspaceLeafFile(workspaceLeaf));
    });
  }

  private async ensureRichDocumentHtml(file: TFile | null) {
    if (!shouldRouteFileToLibreEditor(file)) {
      return null;
    }

    const mapping = await this.richDocumentStore?.getOrCreateMapping(file.path);

    if (!mapping || !this.richDocumentStore) {
      return null;
    }

    const importResult = await ensureFirstMarkdownImport({
      markdownRenderer: (bodyMarkdown, containerElement, sourcePath) =>
        renderMarkdownWithObsidian(this.app, bodyMarkdown, containerElement, sourcePath),
      markdownFile: file,
      mapping,
      richDocumentStore: this.richDocumentStore,
      vaultAdapter: this.app.vault.adapter,
      vaultReader: this.app.vault,
    });

    return importResult.htmlSource;
  }

  private shouldSkipMarkdownRouting(workspaceLeaf: WorkspaceLeaf | null) {
    return workspaceLeaf !== null && this.nativeFallbackLeaves.has(workspaceLeaf);
  }
}
