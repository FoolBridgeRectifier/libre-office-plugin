import type {
  RichDocumentConflictCopySource,
  RichDocumentMapping,
  RichDocumentSourceKind,
  RichDocumentSourceState,
  RichDocumentStore,
  RichDocumentVaultAdapter,
} from '../rich-documents/interfaces';

export interface ConflictCreationOptions {
  readonly changedSources: ReadonlyArray<RichDocumentSourceKind>;
  readonly currentHtmlSource?: string;
  readonly detectedAt: string;
  readonly mapping: RichDocumentMapping;
  readonly reason:
    | 'manual-recovery'
    | 'missing-rich-file'
    | 'multi-source-change'
    | 'timestamp-drift';
  readonly vaultAdapter: RichDocumentVaultAdapter;
}

export interface ConflictSourceCopyRequest {
  readonly content: string;
  readonly detectedAt: string;
  readonly mapping: RichDocumentMapping;
  readonly source: RichDocumentConflictCopySource;
  readonly sourcePath: string;
  readonly vaultAdapter: RichDocumentVaultAdapter;
}

export interface SourceSnapshotRequest {
  readonly path: string;
  readonly vaultAdapter: RichDocumentVaultAdapter;
}

export interface SourceStateChange {
  readonly currentState: RichDocumentSourceState | null;
  readonly previousState: RichDocumentSourceState | null;
  readonly source: RichDocumentSourceKind;
}

export type ConflictResolutionChoice = 'duplicate-conflict-copy' | RichDocumentSourceKind;

export interface ConflictResolutionOptions {
  readonly choice: ConflictResolutionChoice;
  readonly getCurrentTimestamp?: () => string;
  readonly markdownPath: string;
  readonly markdownToHtmlSource?: MarkdownToHtmlSource;
  readonly richDocumentStore: RichDocumentStore;
  readonly vaultAdapter: RichDocumentVaultAdapter;
}

type MarkdownToHtmlSource = (markdownSource: string, sourcePath: string) => Promise<string>;
