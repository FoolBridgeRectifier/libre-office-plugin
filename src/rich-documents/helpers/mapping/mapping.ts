import { RICH_DOCUMENT_ID_PREFIX } from '../../constants';
import { createRichDocumentFilePaths, sanitizeRichDocumentId } from '../paths/paths';
import type {
  RichDocumentEditorPlatform,
  RichDocumentMapping,
  RichDocumentSyncTimestamps,
} from '../../interfaces';

export function createRichDocumentMapping(
  markdownPath: string,
  richDocumentId: string,
  timestamp: string,
  lastEditorPlatform: RichDocumentEditorPlatform
): RichDocumentMapping {
  const richDocumentFilePaths = createRichDocumentFilePaths(richDocumentId);

  return {
    activeSource: 'markdown',
    archivedAt: null,
    conflictState: { status: 'none' },
    htmlPath: richDocumentFilePaths.htmlPath,
    lastEditorPlatform,
    lifecycleState: 'active',
    markdownPath,
    odtPath: richDocumentFilePaths.odtPath,
    richDocumentId: sanitizeRichDocumentId(richDocumentId),
    syncTimestamps: createSyncTimestamps(timestamp),
  };
}

export function createArchivedRichDocumentMapping(
  mapping: RichDocumentMapping,
  htmlPath: string,
  odtPath: string,
  timestamp: string
): RichDocumentMapping {
  return {
    ...mapping,
    archivedAt: timestamp,
    htmlPath,
    lifecycleState: 'archived',
    odtPath,
  };
}

export function createStableRichDocumentId(timestamp: string, randomValue: number): string {
  const timestampSegment = timestamp.replace(/[^0-9]/g, '').slice(0, 14) || 'current';
  const randomSegment = Math.floor(randomValue * Number.MAX_SAFE_INTEGER).toString(36);

  return `${RICH_DOCUMENT_ID_PREFIX}-${timestampSegment}-${randomSegment}`;
}

function createSyncTimestamps(timestamp: string): RichDocumentSyncTimestamps {
  return {
    htmlSyncedAt: null,
    lastSyncedAt: timestamp,
    markdownSyncedAt: timestamp,
    odtSyncedAt: null,
  };
}
