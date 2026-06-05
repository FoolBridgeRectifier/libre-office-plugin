import type {
  RichDocumentActiveSource,
  RichDocumentConflictCopySource,
  RichDocumentMapping,
  RichDocumentSourceKind,
  RichDocumentSourceState,
  RichDocumentVaultAdapter,
} from '../rich-documents/interfaces';

export interface ConflictCreationOptions {
  readonly changedSources: ReadonlyArray<RichDocumentSourceKind>;
  readonly desktopHtmlSource?: string;
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
  readonly source: RichDocumentSourceKind;
  readonly vaultAdapter: RichDocumentVaultAdapter;
}

export interface SourceStateChange {
  readonly currentState: RichDocumentSourceState | null;
  readonly previousState: RichDocumentSourceState | null;
  readonly source: RichDocumentSourceKind;
}

export type ConflictResolutionChoice =
  | 'duplicate-conflict-copy'
  | RichDocumentActiveSource
  | 'desktop'
  | 'mobile';
