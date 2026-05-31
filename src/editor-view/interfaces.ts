import type { TFile, ViewCreator } from 'obsidian';

export interface FileTrackingView {
  readonly file?: TFile | null;
  getViewType(): string;
}

export interface LibreMarkdownRegistrationTarget {
  registerView(viewType: string, viewCreator: ViewCreator): void;
}
