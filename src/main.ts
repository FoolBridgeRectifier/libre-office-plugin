import { Platform, Plugin, type TFile, type WorkspaceLeaf } from 'obsidian';

import { EditorView } from './editor-view/EditorView';
import {
  detachLibreMarkdownLeaves,
  getWorkspaceLeafFile,
  registerLibreMarkdownRouting,
  routeMostRecentMarkdownLeafToLibreEditor,
  routeOpenMarkdownLeavesToLibreEditor,
  routeWorkspaceLeafToLibreEditor,
  shouldRouteFileToLibreEditor,
  shouldSkipNativeFallbackRouting,
} from './editor-view/helpers';
import { registerEditorViewLinkWarningRefresh } from './editor-view/helpers/link-warnings/linkWarnings';
import { createRichDocumentEditorViewOptions } from './editor-view/helpers/options/options';
import { flushOpenLibreEditors, registerRichDocumentMappingEvents } from './helpers';
import { registerOpenDesktopOdtCommand } from './helpers/desktop-odt-command/desktopOdtCommand';
import { registerNativeMarkdownFallbackCommand } from './helpers/native-markdown-command/nativeMarkdownCommand';
import { loadRichDocumentHtmlForStore } from './helpers/rich-html/richHtml';
import { createSkippedMobileRuntimeSetupState } from './office-runtime/helpers/setup-state/setupState';
import type { OfficeRuntimeSetupState } from './office-runtime/interfaces';
import { createRichDocumentStore } from './rich-documents/richDocuments';
import type { RichDocumentStore } from './rich-documents/interfaces';
import { DEFAULT_LIBRE_NOTE_EDITOR_SETTINGS } from './settings/constants';
import { LibreNoteEditorSettingsTab } from './settings/Settings';
import {
  getLibreNoteEditorActiveSource,
  loadLibreNoteEditorSettings,
  refreshOpenLibreNoteEditorViews,
  saveLibreNoteEditorSettings,
} from './settings/helpers';
import { detectLibreNoteEditorOfficeRuntime } from './settings/helpers/runtime/runtime';
import type { LibreNoteEditorSettings } from './settings/interfaces';
import '../styles.css';
export default class LibreNoteEditorPlugin extends Plugin {
  private nativeFallbackLeaves = new WeakSet<WorkspaceLeaf>();
  private officeRuntimeSetupState: OfficeRuntimeSetupState = createSkippedMobileRuntimeSetupState();
  private richDocumentStore: RichDocumentStore | null = null;
  settings: LibreNoteEditorSettings = DEFAULT_LIBRE_NOTE_EDITOR_SETTINGS;

  async onload(): Promise<void> {
    this.settings = await loadLibreNoteEditorSettings(this);
    this.officeRuntimeSetupState = await detectLibreNoteEditorOfficeRuntime(this);

    this.addSettingTab(new LibreNoteEditorSettingsTab(this));

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
            () => this.officeRuntimeSetupState,
            () => this.settings,
            () =>
              getLibreNoteEditorActiveSource(
                this.settings,
                this.officeRuntimeSetupState,
                Platform.isMobile
              )
          )
        )
    );

    registerNativeMarkdownFallbackCommand({
      getIsFallbackVisible: () => this.settings.showMarkdownSourceFallback,
      nativeFallbackLeaves: this.nativeFallbackLeaves,
      target: this,
    });

    registerOpenDesktopOdtCommand({
      getOfficeRuntimeSetupState: () => this.officeRuntimeSetupState,
      getRichDocumentStore: () => this.richDocumentStore,
      target: this,
    });

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
  async saveSettings(settings: LibreNoteEditorSettings): Promise<void> {
    this.settings = settings;
    await saveLibreNoteEditorSettings(this, settings);
    refreshOpenLibreNoteEditorViews(this.app.workspace);
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
