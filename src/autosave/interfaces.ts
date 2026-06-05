export type AutosaveStatus =
  | 'conflicted'
  | 'dirty'
  | 'error'
  | 'saved'
  | 'saving'
  | 'syncing-markdown';

export type AutosaveTimerHandle = ReturnType<typeof setTimeout>;

export interface AutosaveController {
  clearActiveDocument(): Promise<void>;
  flushAll(): Promise<void>;
  flushHtml(): Promise<void>;
  handleHtmlSourceChange(htmlSource: string): void;
  setActiveDocument(document: AutosaveDocument | null): void;
}

export interface AutosaveControllerOptions {
  readonly htmlAutosaveIntervalMs?: number;
  readonly markdownSyncIntervalMs?: number;
  readonly onStatusChange?: (status: AutosaveStatus) => void;
  readonly retryDelayMs?: number;
  readonly saveHtmlSource: AutosaveHtmlSaveHandler;
  readonly syncMarkdownMirror: AutosaveMarkdownSyncHandler;
}

export interface AutosaveDocument {
  readonly htmlSource: string;
  readonly markdownPath: string;
}

export interface AutosaveHtmlSaveRequest {
  readonly htmlSource: string;
  readonly markdownPath: string;
  readonly previousHtmlSource: string;
}

export type AutosaveHtmlSaveHandler = (request: AutosaveHtmlSaveRequest) => Promise<void>;

export interface AutosaveMarkdownSyncRequest {
  readonly htmlSource: string;
  readonly markdownPath: string;
}

export type AutosaveMarkdownSyncHandler = (request: AutosaveMarkdownSyncRequest) => Promise<void>;
