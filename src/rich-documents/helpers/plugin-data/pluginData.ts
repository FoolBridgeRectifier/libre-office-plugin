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
  // Obsidian persists this object through Plugin.saveData/loadData.
  return {
    mappings,
    version: RICH_DOCUMENT_PLUGIN_DATA_VERSION,
  };
}

export function normalizeRichDocumentPluginData(data: unknown): RichDocumentPluginData {
  // Treat unknown plugin data as hostile because users can edit JSON or sync stale files.
  if (!isRecord(data) || !Array.isArray(data.mappings)) {
    return createRichDocumentPluginData([]);
  }

  return createRichDocumentPluginData(data.mappings.flatMap(normalizeRichDocumentMapping));
}

export function serializeRichDocumentMapping(mapping: RichDocumentMapping): string {
  // Sidecars are formatted for human inspection during recovery/debugging.
  return JSON.stringify(mapping, null, 2);
}

export function parseRichDocumentMapping(sourceText: string): RichDocumentMapping | null {
  try {
    // Sidecars use the same normalization path as plugin data.
    return normalizeRichDocumentMapping(JSON.parse(sourceText))[0] ?? null;
  } catch {
    return null;
  }
}

function normalizeRichDocumentMapping(value: unknown): RichDocumentMapping[] {
  // Returning an array lets callers flatMap invalid entries away without special cases.
  if (!isRecord(value) || typeof value.markdownPath !== 'string') {
    return [];
  }

  if (typeof value.richDocumentId !== 'string') {
    return [];
  }

  const richDocumentId = sanitizeRichDocumentId(value.richDocumentId);
  const richDocumentFilePaths = createRichDocumentFilePaths(richDocumentId);

  // Paths are repaired from the rich id if persisted data points outside our document root.
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
  // Unknown conflict shapes are safer as non-conflicted than partially trusted data.
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
  // Missing timestamps remain null so future sync checks can distinguish unknown from synced.
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
  // Literal guards keep old or edited plugin data inside the current domain model.
  return allowedValues.includes(value as TValue) ? (value as TValue) : fallbackValue;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
