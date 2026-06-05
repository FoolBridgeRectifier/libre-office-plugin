import type {
  RichDocumentConflictCopy,
  RichDocumentConflictState,
  RichDocumentSourceKind,
} from '../../../../interfaces';

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
    ['html', 'markdown', 'odt'].includes(String(sourceKind))
  );
}

function normalizeConflictCopies(value: unknown): RichDocumentConflictCopy[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((copyValue) => {
    if (!isRecord(copyValue) || typeof copyValue.path !== 'string') {
      return [];
    }

    return [
      {
        createdAt: typeof copyValue.createdAt === 'string' ? copyValue.createdAt : '',
        path: copyValue.path,
        source: getLiteral(
          copyValue.source,
          ['desktop', 'html', 'markdown', 'mobile', 'odt'],
          'html'
        ),
      },
    ];
  });
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
