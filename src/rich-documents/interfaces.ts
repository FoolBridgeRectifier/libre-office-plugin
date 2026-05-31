export type RichDocumentActiveSource = 'markdown' | 'html' | 'odt';

export type RichDocumentConflictState =
  | { readonly status: 'none' }
  | {
      readonly detectedAt: string;
      readonly reason: 'timestamp-drift' | 'missing-rich-file' | 'manual-recovery';
      readonly status: 'conflicted';
    };

export type RichDocumentEditorPlatform = 'desktop' | 'mobile' | 'unknown';

export type RichDocumentLifecycleState = 'active' | 'archived';

export interface RichDocumentFilePaths {
  readonly folderPath: string;
  readonly htmlPath: string;
  readonly mappingPath: string;
  readonly odtPath: string;
}

export interface RichDocumentMapping {
  readonly activeSource: RichDocumentActiveSource;
  readonly archivedAt: string | null;
  readonly conflictState: RichDocumentConflictState;
  readonly htmlPath: string;
  readonly lastEditorPlatform: RichDocumentEditorPlatform;
  readonly lifecycleState: RichDocumentLifecycleState;
  readonly markdownPath: string;
  readonly odtPath: string;
  readonly richDocumentId: string;
  readonly syncTimestamps: RichDocumentSyncTimestamps;
}

export interface RichDocumentPluginData {
  readonly mappings: ReadonlyArray<RichDocumentMapping>;
  readonly version: 1;
}

export interface RichDocumentPersistenceTarget {
  loadData(): Promise<unknown>;
  saveData(data: RichDocumentPluginData): Promise<void>;
}

export interface RichDocumentStore {
  archiveMapping(markdownPath: string): Promise<RichDocumentMapping | null>;
  deleteMapping(markdownPath: string): Promise<RichDocumentMapping | null>;
  getMappingByMarkdownPath(markdownPath: string): Promise<RichDocumentMapping | null>;
  getMappingByRichDocumentId(richDocumentId: string): Promise<RichDocumentMapping | null>;
  getOrCreateMapping(markdownPath: string): Promise<RichDocumentMapping>;
  loadMappings(): Promise<ReadonlyArray<RichDocumentMapping>>;
  recoverMappings(): Promise<ReadonlyArray<RichDocumentMapping>>;
  renameMapping(
    previousMarkdownPath: string,
    nextMarkdownPath: string
  ): Promise<RichDocumentMapping>;
  updateMapping(markdownPath: string, patch: RichDocumentStorePatch): Promise<RichDocumentMapping>;
}

export interface RichDocumentStoreOptions {
  readonly createRichDocumentId?: () => string;
  readonly getCurrentTimestamp?: () => string;
  readonly lastEditorPlatform?: RichDocumentEditorPlatform;
  readonly persistenceTarget: RichDocumentPersistenceTarget;
  readonly vaultAdapter: RichDocumentVaultAdapter;
}

export interface RichDocumentStorePatch {
  readonly activeSource?: RichDocumentActiveSource;
  readonly conflictState?: RichDocumentConflictState;
  readonly lastEditorPlatform?: RichDocumentEditorPlatform;
  readonly syncTimestamps?: RichDocumentSyncTimestamps;
}

export interface RichDocumentSyncTimestamps {
  readonly htmlSyncedAt: string | null;
  readonly lastSyncedAt: string | null;
  readonly markdownSyncedAt: string | null;
  readonly odtSyncedAt: string | null;
}

export interface RichDocumentVaultAdapter {
  exists(normalizedPath: string, sensitive?: boolean): Promise<boolean>;
  list(normalizedPath: string): Promise<{ readonly files: string[]; readonly folders: string[] }>;
  mkdir(normalizedPath: string): Promise<void>;
  read(normalizedPath: string): Promise<string>;
  rename(normalizedPath: string, normalizedNewPath: string): Promise<void>;
  write(normalizedPath: string, data: string): Promise<void>;
}
