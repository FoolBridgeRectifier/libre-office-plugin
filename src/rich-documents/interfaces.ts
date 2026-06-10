export type RichDocumentActiveSource = 'markdown' | 'html';

export interface RichDocumentConflictCopy {
  readonly createdAt: string;
  readonly path: string;
  readonly source: RichDocumentConflictCopySource;
}

export type RichDocumentConflictCopySource = 'html' | 'markdown';

type RichDocumentConflictReason =
  | 'manual-recovery'
  | 'missing-rich-file'
  | 'multi-source-change'
  | 'timestamp-drift';

export type RichDocumentConflictState =
  | { readonly status: 'none' }
  | {
      readonly changedSources: ReadonlyArray<RichDocumentSourceKind>;
      readonly conflictCopies: ReadonlyArray<RichDocumentConflictCopy>;
      readonly detectedAt: string;
      readonly reason: RichDocumentConflictReason;
      readonly status: 'conflicted';
    };

export type RichDocumentEditorPlatform = 'desktop' | 'mobile' | 'unknown';

type RichDocumentLifecycleState = 'active' | 'archived';

export interface RichDocumentFilePaths {
  readonly folderPath: string;
  readonly htmlPath: string;
  readonly mappingPath: string;
}

export interface RichDocumentMapping {
  readonly activeSource: RichDocumentActiveSource;
  readonly archivedAt: string | null;
  readonly conflictState: RichDocumentConflictState;
  readonly htmlPath: string;
  readonly lastEditorPlatform: RichDocumentEditorPlatform;
  readonly lifecycleState: RichDocumentLifecycleState;
  readonly markdownPath: string;
  readonly richDocumentId: string;
  readonly sourceStates: RichDocumentSourceStates;
  readonly syncTimestamps: RichDocumentSyncTimestamps;
}

export interface RichDocumentPluginData {
  readonly mappings: ReadonlyArray<RichDocumentMapping>;
  readonly version: 1;
}

interface RichDocumentPersistenceTarget {
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

interface RichDocumentStorePatch {
  readonly activeSource?: RichDocumentActiveSource;
  readonly conflictState?: RichDocumentConflictState;
  readonly lastEditorPlatform?: RichDocumentEditorPlatform;
  readonly sourceStates?: RichDocumentSourceStates;
  readonly syncTimestamps?: RichDocumentSyncTimestamps;
}

export type RichDocumentSourceKind = 'html' | 'markdown';

export interface RichDocumentSourceState {
  readonly contentHash: string | null;
  readonly exists: boolean;
  readonly modifiedTime: number | null;
}

export interface RichDocumentSourceStates {
  readonly html: RichDocumentSourceState | null;
  readonly markdown: RichDocumentSourceState | null;
}

export interface RichDocumentSyncTimestamps {
  readonly htmlSyncedAt: string | null;
  readonly lastSyncedAt: string | null;
  readonly markdownSyncedAt: string | null;
}

export interface RichDocumentVaultAdapter {
  exists(normalizedPath: string, sensitive?: boolean): Promise<boolean>;
  list(normalizedPath: string): Promise<{ readonly files: string[]; readonly folders: string[] }>;
  mkdir(normalizedPath: string): Promise<void>;
  read(normalizedPath: string): Promise<string>;
  rename(normalizedPath: string, normalizedNewPath: string): Promise<void>;
  stat?(
    normalizedPath: string
  ): Promise<{ readonly ctime?: number; readonly mtime?: number; readonly size?: number } | null>;
  write(normalizedPath: string, data: string): Promise<void>;
}
