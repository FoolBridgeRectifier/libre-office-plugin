import { createSourceStates } from '../conflicts';
import type { RichDocumentHtmlSaveOptions, RichDocumentSourceWriteOptions } from '../interfaces';
import type { SourceStateChange } from '../conflicts/interfaces';
import type {
  RichDocumentSourceKind,
  RichDocumentStore,
  RichDocumentVaultAdapter,
} from '../rich-documents/interfaces';

export function getHtmlSaveConflictSources(
  sourceChanges: ReadonlyArray<SourceStateChange>,
  htmlChanged: boolean,
  localHtmlChanged: boolean
): ReadonlyArray<RichDocumentSourceKind> {
  const changedSources = new Set(sourceChanges.map((sourceChange) => sourceChange.source));

  if (htmlChanged || localHtmlChanged) {
    changedSources.add('html');
  }

  return Array.from(changedSources);
}

export function getMarkdownMirrorConflictSources(
  sourceChanges: ReadonlyArray<SourceStateChange>
): ReadonlyArray<RichDocumentSourceKind> {
  const changedSources = new Set<RichDocumentSourceKind>([
    'html',
    ...sourceChanges.map((sourceChange) => sourceChange.source),
  ]);

  return Array.from(changedSources);
}

export function hasIndependentMarkdownAndHtmlChanges(
  markdownChanged: boolean,
  options: RichDocumentHtmlSaveOptions
): boolean {
  return markdownChanged && options.htmlSource !== options.previousHtmlSource;
}

export function hasRichSourceChange(sourceChanges: ReadonlyArray<SourceStateChange>): boolean {
  return sourceChanges.some((sourceChange) => sourceChange.source !== 'markdown');
}

export async function updateMarkdownSyncTimestamp(
  options: RichDocumentSourceWriteOptions,
  mapping: Awaited<ReturnType<RichDocumentStore['getOrCreateMapping']>>
): Promise<void> {
  const currentTimestamp = new Date().toISOString();
  const sourceStates = await createSourceStates(mapping, options.vaultAdapter);

  await options.richDocumentStore.updateMapping(options.markdownPath, {
    conflictState: { status: 'none' },
    sourceStates,
    syncTimestamps: {
      ...mapping.syncTimestamps,
      lastSyncedAt: currentTimestamp,
      markdownSyncedAt: currentTimestamp,
    },
  });
}

export async function hasExternalHtmlChange(
  vaultAdapter: RichDocumentVaultAdapter,
  htmlPath: string,
  previousHtmlSource: string
): Promise<boolean> {
  if (!(await vaultAdapter.exists(htmlPath))) {
    return false;
  }

  return (await vaultAdapter.read(htmlPath)) !== previousHtmlSource;
}
