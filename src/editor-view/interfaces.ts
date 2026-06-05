import type { TFile, ViewCreator } from 'obsidian';

import type { ObsidianLinkWarning } from '../obsidian-links/interfaces';

export interface EditorViewOptions {
  getLinkWarnings(markdownPath: string, htmlSource: string): ReadonlyArray<ObsidianLinkWarning>;
  loadImportedHtmlSource(file: TFile): Promise<string | null>;
  saveHtmlSource(
    markdownPath: string,
    htmlSource: string,
    previousHtmlSource: string
  ): Promise<void>;
  syncMarkdownMirror(markdownPath: string, htmlSource: string): Promise<void>;
}

export interface EditorViewLoadedState {
  readonly htmlSource: string | null;
  readonly linkWarningCount: number;
}

export interface FileTrackingView {
  readonly file?: TFile | null;
  getViewType(): string;
}

export interface LibreMarkdownRegistrationTarget {
  registerView(viewType: string, viewCreator: ViewCreator): void;
}
