import type {
  RichDocumentConflictCopy,
  RichDocumentConflictState,
  RichDocumentSourceKind,
} from '../../interfaces';
import { isPathInsideRichDocumentsRoot } from '../../paths/paths';

export function normalizeConflictState(value: unknown): RichDocumentConflictState {
  if (!isRecord(value) || value.status !== 'conflicted') {
    return { status: 'none' };
  }

  return {
    changedSources: normalizeChangedSources(value.changedSources),
    conflictCopies: normalizeConflictCopies(value.conflictCopies),
    detectedAt: typeof value.detectedAt === 'string' ? value.detectedAt : '',
    reason: getLiteral(
      value.reason,
      ['timestamp-drift', 'missing-rich-file', 'manual-recovery', 'multi-source-change'],
      'manual-recovery'
    ),
    status: 'conflicted',
  };
}

function normalizeChangedSources(value: unknown): RichDocumentSourceKind[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((sourceKind): sourceKind is RichDocumentSourceKind =>
    ['html', 'markdown'].includes(String(sourceKind))
  );
}

function normalizeConflictCopies(value: unknown): RichDocumentConflictCopy[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((copyValue) => {
    if (
      !isRecord(copyValue) ||
      typeof copyValue.path !== 'string' ||
      !isPathInsideRichDocumentsRoot(copyValue.path)
    ) {
      return [];
    }

    return [
      {
        createdAt: typeof copyValue.createdAt === 'string' ? copyValue.createdAt : '',
        path: copyValue.path,
        source: getConflictCopySource(copyValue.source),
      },
    ];
  });
}

function getConflictCopySource(value: unknown): RichDocumentConflictCopy['source'] {
  return value === 'desktop' || value === 'mobile' || value === 'odt'
    ? 'html'
    : getLiteral(value, ['html', 'markdown'], 'html');
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
