import type { App, Plugin } from 'obsidian';

export type LibreNoteEditorActiveSource = 'desktop-odt' | 'html-fallback';

export type LibreNoteEditorConflictBehavior = 'manual' | 'keep-html' | 'keep-markdown';

export type LibreNoteEditorMode = 'automatic' | 'desktop-odt' | 'html-fallback';

export type LibreNoteEditorPageLayout = 'pageless' | 'page-width';

export interface LibreNoteEditorSettings {
  readonly autosaveIntervalSeconds: number;
  readonly conflictBehavior: LibreNoteEditorConflictBehavior;
  readonly editorMode: LibreNoteEditorMode;
  readonly libreOfficePath: string;
  readonly markdownSyncIntervalSeconds: number;
  readonly pageLayout: LibreNoteEditorPageLayout;
  readonly showMarkdownSourceFallback: boolean;
}

export interface LibreNoteEditorSettingsData {
  readonly settings?: Partial<LibreNoteEditorSettings>;
}

export interface LibreNoteEditorSettingsPersistenceTarget {
  loadData(): Promise<unknown>;
  saveData(data: LibreNoteEditorSettingsData): Promise<void>;
}

export interface LibreNoteEditorSourceEnvironment {
  readonly isRuntimeReady: boolean;
  readonly platform: 'desktop' | 'mobile';
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
