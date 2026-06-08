import type { RichDocumentSourceState, RichDocumentSourceStates } from '../../interfaces';

export function normalizeSourceStates(value: unknown): RichDocumentSourceStates {
  const sourceStatesRecord = isRecord(value) ? value : {};

  return {
    html: normalizeSourceState(sourceStatesRecord.html),
    markdown: normalizeSourceState(sourceStatesRecord.markdown),
    odt: normalizeSourceState(sourceStatesRecord.odt),
  };
}

function normalizeSourceState(value: unknown): RichDocumentSourceState | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    contentHash: getNullableString(value.contentHash),
    exists: value.exists === true,
    modifiedTime: typeof value.modifiedTime === 'number' ? value.modifiedTime : null,
  };
}

function getNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
