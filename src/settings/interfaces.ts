import type { App, Plugin } from 'obsidian';

export type LibreNoteEditorConflictBehavior = 'manual' | 'keep-html' | 'keep-markdown';

export type LibreNoteEditorPageLayout = 'pageless' | 'page-width';

export interface LibreNoteEditorSettings {
  readonly autosaveIntervalSeconds: number;
  readonly conflictBehavior: LibreNoteEditorConflictBehavior;
  readonly markdownSyncIntervalSeconds: number;
  readonly pageLayout: LibreNoteEditorPageLayout;
  readonly showMarkdownSourceFallback: boolean;
}

interface LibreNoteEditorSettingsData {
  readonly settings?: Partial<LibreNoteEditorSettings>;
}

export interface LibreNoteEditorSettingsPersistenceTarget {
  loadData(): Promise<unknown>;
  saveData(data: LibreNoteEditorSettingsData): Promise<void>;
}

export interface LibreNoteEditorSettingsPlugin extends Plugin {
  readonly app: App;
  settings: LibreNoteEditorSettings;
  saveSettings(settings: LibreNoteEditorSettings): Promise<void>;
}

export interface IntervalValidationResult {
  readonly intervalSeconds: number | null;
  readonly message: string;
  readonly status: 'valid' | 'invalid';
}
