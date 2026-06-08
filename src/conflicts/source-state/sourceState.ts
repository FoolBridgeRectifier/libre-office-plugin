import type {
  RichDocumentMapping,
  RichDocumentSourceState,
  RichDocumentSourceStates,
} from '../../rich-documents/interfaces';
import type { SourceSnapshotRequest, SourceStateChange } from '../interfaces';

export function createContentHash(sourceText: string): string {
  let hashValue = 2166136261;

  for (let characterIndex = 0; characterIndex < sourceText.length; characterIndex += 1) {
    hashValue ^= sourceText.charCodeAt(characterIndex);
    hashValue = Math.imul(hashValue, 16777619);
  }

  return (hashValue >>> 0).toString(16).padStart(8, '0');
}

export async function createSourceSnapshot(
  request: SourceSnapshotRequest
): Promise<RichDocumentSourceState> {
  const exists = await request.vaultAdapter.exists(request.path);

  if (!exists) {
    return { contentHash: null, exists: false, modifiedTime: null };
  }

  const sourceText = await request.vaultAdapter.read(request.path);
  const fileStat = await request.vaultAdapter.stat?.(request.path);

  return {
    contentHash: createContentHash(sourceText),
    exists: true,
    modifiedTime: fileStat?.mtime ?? null,
  };
}

export async function createSourceStates(
  mapping: RichDocumentMapping,
  vaultAdapter: SourceSnapshotRequest['vaultAdapter']
): Promise<RichDocumentSourceStates> {
  return {
    html: await createSourceSnapshot({ path: mapping.htmlPath, vaultAdapter }),
    markdown: await createSourceSnapshot({
      path: mapping.markdownPath,
      vaultAdapter,
    }),
    odt: await createSourceSnapshot({ path: mapping.odtPath, vaultAdapter }),
  };
}

export function collectChangedSourceStates(
  previousStates: RichDocumentSourceStates,
  currentStates: RichDocumentSourceStates
): SourceStateChange[] {
  return (['markdown', 'html', 'odt'] as const)
    .map((source) => ({
      currentState: currentStates[source],
      previousState: previousStates[source],
      source,
    }))
    .filter((sourceChange) =>
      hasSourceStateChanged(sourceChange.previousState, sourceChange.currentState)
    );
}

export function hasSourceStateChanged(
  previousState: RichDocumentSourceState | null,
  currentState: RichDocumentSourceState | null
): boolean {
  if (previousState === null || currentState === null) {
    return false;
  }

  return (
    previousState.exists !== currentState.exists ||
    previousState.contentHash !== currentState.contentHash
  );
}
