import type { TFile, ViewCreator } from 'obsidian';

export interface EditorViewOptions {
  loadImportedHtmlSource(file: TFile): Promise<string | null>;
  saveHtmlSource(
    markdownPath: string,
    htmlSource: string,
    previousHtmlSource: string
  ): Promise<void>;
  syncMarkdownMirror(markdownPath: string, htmlSource: string): Promise<void>;
}

export interface FileTrackingView {
  readonly file?: TFile | null;
  getViewType(): string;
}

export interface LibreMarkdownRegistrationTarget {
  registerView(viewType: string, viewCreator: ViewCreator): void;
}
