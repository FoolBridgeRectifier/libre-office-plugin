import { RICH_DOCUMENT_PLUGIN_DATA_VERSION } from '../../constants';
import {
  createRichDocumentFilePaths,
  isPathInsideRichDocumentsRoot,
  sanitizeRichDocumentId,
} from '../paths/paths';
import type {
  RichDocumentConflictState,
  RichDocumentMapping,
  RichDocumentPluginData,
  RichDocumentSyncTimestamps,
} from '../../interfaces';

export function createRichDocumentPluginData(
  mappings: ReadonlyArray<RichDocumentMapping>
): RichDocumentPluginData {
  return {
    mappings,
    version: RICH_DOCUMENT_PLUGIN_DATA_VERSION,
  };
}

export function normalizeRichDocumentPluginData(data: unknown): RichDocumentPluginData {
  if (!isRecord(data) || !Array.isArray(data.mappings)) {
    return createRichDocumentPluginData([]);
  }

  return createRichDocumentPluginData(data.mappings.flatMap(normalizeRichDocumentMapping));
}

export function serializeRichDocumentMapping(mapping: RichDocumentMapping): string {
  return JSON.stringify(mapping, null, 2);
}

export function parseRichDocumentMapping(sourceText: string): RichDocumentMapping | null {
  try {
    return normalizeRichDocumentMapping(JSON.parse(sourceText))[0] ?? null;
  } catch {
    return null;
  }
}

function normalizeRichDocumentMapping(value: unknown): RichDocumentMapping[] {
  if (!isRecord(value) || typeof value.markdownPath !== 'string') {
    return [];
  }

  if (typeof value.richDocumentId !== 'string') {
    return [];
  }

  const richDocumentId = sanitizeRichDocumentId(value.richDocumentId);
  const richDocumentFilePaths = createRichDocumentFilePaths(richDocumentId);

  return [
    {
      activeSource: getLiteral(value.activeSource, ['markdown', 'html', 'odt'], 'markdown'),
      archivedAt: typeof value.archivedAt === 'string' ? value.archivedAt : null,
      conflictState: normalizeConflictState(value.conflictState),
      htmlPath: getSafePath(value.htmlPath, richDocumentFilePaths.htmlPath),
      lastEditorPlatform: getLiteral(
        value.lastEditorPlatform,
        ['desktop', 'mobile', 'unknown'],
        'unknown'
      ),
      lifecycleState: getLiteral(value.lifecycleState, ['active', 'archived'], 'active'),
      markdownPath: value.markdownPath,
      odtPath: getSafePath(value.odtPath, richDocumentFilePaths.odtPath),
      richDocumentId,
      syncTimestamps: normalizeSyncTimestamps(value.syncTimestamps),
    },
  ];
}

function normalizeConflictState(value: unknown): RichDocumentConflictState {
  if (!isRecord(value) || value.status !== 'conflicted') {
    return { status: 'none' };
  }

  return {
    detectedAt: typeof value.detectedAt === 'string' ? value.detectedAt : '',
    reason: getLiteral(
      value.reason,
      ['timestamp-drift', 'missing-rich-file', 'manual-recovery'],
      'manual-recovery'
    ),
    status: 'conflicted',
  };
}

function normalizeSyncTimestamps(value: unknown): RichDocumentSyncTimestamps {
  const timestampRecord = isRecord(value) ? value : {};

  return {
    htmlSyncedAt: getNullableString(timestampRecord.htmlSyncedAt),
    lastSyncedAt: getNullableString(timestampRecord.lastSyncedAt),
    markdownSyncedAt: getNullableString(timestampRecord.markdownSyncedAt),
    odtSyncedAt: getNullableString(timestampRecord.odtSyncedAt),
  };
}

function getSafePath(value: unknown, fallbackPath: string): string {
  return typeof value === 'string' && isPathInsideRichDocumentsRoot(value) ? value : fallbackPath;
}

function getNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function getLiteral<TValue extends string>(
  value: unknown,
  allowedValues: readonly TValue[],
  fallbackValue: TValue
): TValue {
  return allowedValues.includes(value as TValue) ? (value as TValue) : fallbackValue;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
