import type { TFile, ViewCreator } from 'obsidian';

import type { AutosaveController, AutosaveStatus } from '../autosave/interfaces';
import type { ConflictResolutionChoice } from '../conflicts/interfaces';
import type { ObsidianLinkWarning } from '../obsidian-links/interfaces';
import type { LibreNoteEditorPageLayout } from '../settings/interfaces';

export interface EditorViewOptions {
  readonly htmlAutosaveIntervalMs?: number;
  readonly markdownSyncIntervalMs?: number;
  getPageLayout?(): LibreNoteEditorPageLayout;
  getInitialAutosaveStatus?(file: TFile): Promise<AutosaveStatus>;
  getLinkWarnings(markdownPath: string, htmlSource: string): ReadonlyArray<ObsidianLinkWarning>;
  loadImportedHtmlSource(file: TFile): Promise<string | null>;
  navigateInternalLink?(target: string, sourcePath: string): void;
  navigateTag?(tagText: string): void;
  openExternalLink?(url: string): void;
  saveHtmlSource(
    markdownPath: string,
    htmlSource: string,
    previousHtmlSource: string
  ): Promise<void>;
  resolveConflict(markdownPath: string, choice: ConflictResolutionChoice): Promise<string | null>;
  syncMarkdownMirror(markdownPath: string, htmlSource: string): Promise<void>;
}

export interface EditorViewLoadedState {
  readonly autosaveStatus: AutosaveStatus;
  readonly htmlSource: string | null;
  readonly linkWarningCount: number;
}

export interface EditorViewLoadedStateTarget {
  autosaveStatus: AutosaveStatus;
  activeMarkdownFile: TFile | null;
  importedHtmlSource: string | null;
  isResolvingConflict: boolean;
  linkWarningCount: number;
  showHtmlEmptyState: boolean;
  renderReactApp(): void;
}

export interface EditorViewSourceTarget extends EditorViewLoadedStateTarget {
  readonly autosaveController: AutosaveController;
  readonly editorViewOptions: EditorViewOptions;
}

export interface EditorViewRenderTarget {
  readonly activeMarkdownFile: TFile | null;
  readonly autosaveStatus: AutosaveStatus;
  readonly importedHtmlSource: string | null;
  readonly isResolvingConflict: boolean;
  readonly linkWarningCount: number;
  pageLayout: LibreNoteEditorPageLayout;
  readonly showHtmlEmptyState: boolean;
  handleEditorBlur(): void;
  handleExternalLinkNavigate(url: string): void;
  handleHtmlSourceChange(htmlSource: string): void;
  handleInternalLinkNavigate(target: string): void;
  handleResolveConflict(choice: ConflictResolutionChoice): void;
  handleTagNavigate(tagText: string): void;
}

export interface FileTrackingView {
  readonly file?: TFile | null;
  getViewType(): string;
}

export interface LibreMarkdownRegistrationTarget {
  registerView(viewType: string, viewCreator: ViewCreator): void;
}
