import { Platform, Plugin, type TFile, type WorkspaceLeaf } from 'obsidian';

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
  shouldSkipNativeFallbackRouting,
} from './editor-view/helpers';
import {
  OPEN_NATIVE_MARKDOWN_COMMAND_ID,
  OPEN_NATIVE_MARKDOWN_COMMAND_NAME,
} from './editor-view/constants';
import { registerEditorViewLinkWarningRefresh } from './editor-view/helpers/link-warnings/linkWarnings';
import { createRichDocumentEditorViewOptions } from './editor-view/helpers/options/options';
import { flushOpenLibreEditors, registerRichDocumentMappingEvents } from './helpers';
import { loadRichDocumentHtmlForStore } from './helpers/rich-html/richHtml';
import { getConfiguredOfficeRuntimePath } from './office-runtime/helpers';
import {
  getBundledOfficeRuntimeRootPath,
  getCurrentOfficeRuntimeOperatingSystem,
  getPluginManifestDirectory,
} from './office-runtime/helpers/platform/platform';
import { createSkippedMobileRuntimeSetupState } from './office-runtime/helpers/setup-state/setupState';
import { detectOfficeRuntime } from './office-runtime/officeRuntime';
import type { OfficeRuntimeSetupState } from './office-runtime/interfaces';
import { createRichDocumentStore } from './rich-documents/richDocuments';
import type { RichDocumentStore } from './rich-documents/interfaces';
import '../styles.css';
export default class LibreNoteEditorPlugin extends Plugin {
  private nativeFallbackLeaves = new WeakSet<WorkspaceLeaf>();
  private officeRuntimeSetupState: OfficeRuntimeSetupState = createSkippedMobileRuntimeSetupState();
  private richDocumentStore: RichDocumentStore | null = null;

  async onload(): Promise<void> {
    const pluginData = await this.loadData();

    this.officeRuntimeSetupState = await detectOfficeRuntime({
      bundledRootPath: getBundledOfficeRuntimeRootPath(getPluginManifestDirectory(this)),
      configuredPath: getConfiguredOfficeRuntimePath(pluginData),
      operatingSystem: getCurrentOfficeRuntimeOperatingSystem(Platform),
      platform: Platform.isMobile ? 'mobile' : 'desktop',
    });

    this.richDocumentStore = createRichDocumentStore({
      lastEditorPlatform: 'desktop',
      persistenceTarget: this,
      vaultAdapter: this.app.vault.adapter,
    });

    await this.richDocumentStore.loadMappings();
    const richDocumentStore = this.richDocumentStore;

    registerLibreMarkdownRouting(
      this,
      (workspaceLeaf) =>
        new EditorView(
          workspaceLeaf,
          createRichDocumentEditorViewOptions(
            this.app,
            richDocumentStore,
            () => this.officeRuntimeSetupState
          )
        )
    );

    this.registerNativeMarkdownFallbackCommand();
    this.registerMarkdownRoutingEvents();
    registerRichDocumentMappingEvents(this, this.richDocumentStore);
    registerEditorViewLinkWarningRefresh(this);

    this.app.workspace.onLayoutReady(() => {
      this.ensureMappingsForOpenMarkdownLeaves();
      void routeOpenMarkdownLeavesToLibreEditor(this.app.workspace);
    });
  }
  async onunload(): Promise<void> {
    await flushOpenLibreEditors(this.app.workspace);
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

        if (shouldSkipNativeFallbackRouting(navigationLeaf, this.nativeFallbackLeaves)) {
          return;
        }

        void this.ensureRichDocumentHtml(file);
        void routeMostRecentMarkdownLeafToLibreEditor(this.app.workspace, file);
      })
    );

    this.registerEvent(
      this.app.workspace.on('active-leaf-change', (workspaceLeaf) => {
        if (
          !workspaceLeaf ||
          shouldSkipNativeFallbackRouting(workspaceLeaf, this.nativeFallbackLeaves)
        ) {
          return;
        }

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

    return loadRichDocumentHtmlForStore(this.app, file, this.richDocumentStore);
  }
}
