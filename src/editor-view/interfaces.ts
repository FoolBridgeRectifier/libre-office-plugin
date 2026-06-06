import type { TFile, ViewCreator } from 'obsidian';

import type { AutosaveController, AutosaveStatus } from '../autosave/interfaces';
import type { ConflictResolutionChoice } from '../conflicts/interfaces';
import type { OfficeRuntimeSetupState } from '../office-runtime/interfaces';
import type { ObsidianLinkWarning } from '../obsidian-links/interfaces';

export interface EditorViewOptions {
  getOfficeRuntimeSetupState?(): OfficeRuntimeSetupState;
  getInitialAutosaveStatus?(file: TFile): Promise<AutosaveStatus>;
  getLinkWarnings(markdownPath: string, htmlSource: string): ReadonlyArray<ObsidianLinkWarning>;
  loadImportedHtmlSource(file: TFile): Promise<string | null>;
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
  importedHtmlSource: string | null;
  isResolvingConflict: boolean;
  linkWarningCount: number;
}

export interface EditorViewConflictResolutionResult {
  readonly autosaveStatus: AutosaveStatus;
  readonly htmlSource: string | null;
  readonly linkWarningCount: number;
}

export interface EditorViewConflictResolutionTarget extends EditorViewLoadedStateTarget {
  activeMarkdownFile: TFile | null;
  readonly autosaveController: AutosaveController;
  readonly editorViewOptions: EditorViewOptions;
  renderReactApp(): void;
}

export interface EditorViewRenderTarget {
  readonly activeMarkdownFile: TFile | null;
  readonly autosaveStatus: AutosaveStatus;
  readonly importedHtmlSource: string | null;
  readonly isResolvingConflict: boolean;
  readonly linkWarningCount: number;
  readonly officeRuntimeSetupState: OfficeRuntimeSetupState;
  handleEditorBlur(): void;
  handleHtmlSourceChange(htmlSource: string): void;
  handleResolveConflict(choice: ConflictResolutionChoice): void;
}

export interface FileTrackingView {
  readonly file?: TFile | null;
  getViewType(): string;
}

export interface LibreMarkdownRegistrationTarget {
  registerView(viewType: string, viewCreator: ViewCreator): void;
}
