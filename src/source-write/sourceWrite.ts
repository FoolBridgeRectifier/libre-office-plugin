import { createMarkdownMirrorSource } from '../autosave';
import { collectChangedSourceStates, createConflictState, createSourceStates } from '../conflicts';
import { sanitizeConvertedHtmlSource } from '../conversion';
import {
  getHtmlSaveConflictSources,
  getMarkdownMirrorConflictSources,
  hasExternalHtmlChange,
  hasIndependentMarkdownAndHtmlChanges,
  hasRichSourceChange,
  isArchivedMarkdownMissing,
  updateMarkdownSyncTimestamp,
} from './helpers';
import type { RichDocumentHtmlSaveOptions, RichDocumentSourceWriteOptions } from '../interfaces';

export async function saveRichDocumentHtml(options: RichDocumentHtmlSaveOptions): Promise<void> {
  const sanitizedHtmlSource = sanitizeConvertedHtmlSource(options.htmlSource);
  const mapping = await options.richDocumentStore.getOrCreateMapping(options.markdownPath);

  if (
    await isArchivedMarkdownMissing(
      options.vaultAdapter,
      mapping.markdownPath,
      mapping.lifecycleState
    )
  ) {
    return;
  }

  const currentSourceStates = await createSourceStates(mapping, options.vaultAdapter);
  const sourceChanges = collectChangedSourceStates(mapping.sourceStates, currentSourceStates);

  const markdownChanged = sourceChanges.some((sourceChange) => sourceChange.source === 'markdown');

  const htmlChanged = await hasExternalHtmlChange(
    options.vaultAdapter,
    mapping.htmlPath,
    options.previousHtmlSource
  );

  const richSourceChanged = hasRichSourceChange(sourceChanges);
  const localHtmlChanged = sanitizedHtmlSource !== options.previousHtmlSource;

  const richFileDeleted = sourceChanges.some(
    (sourceChange) =>
      sourceChange.source !== 'markdown' && sourceChange.currentState?.exists === false
  );

  if (mapping.conflictState.status === 'conflicted') {
    throw new Error('Libre Note Editor conflict is unresolved.');
  }

  if (
    htmlChanged ||
    richSourceChanged ||
    hasIndependentMarkdownAndHtmlChanges(markdownChanged, options)
  ) {
    const conflictState = await createConflictState({
      changedSources: getHtmlSaveConflictSources(sourceChanges, htmlChanged, localHtmlChanged),
      desktopHtmlSource: sanitizedHtmlSource,
      detectedAt: new Date().toISOString(),
      mapping,
      reason: richFileDeleted ? 'missing-rich-file' : 'multi-source-change',
      vaultAdapter: options.vaultAdapter,
    });

    await options.richDocumentStore.updateMapping(options.markdownPath, {
      conflictState,
      sourceStates: currentSourceStates,
    });

    throw new Error('Libre Note Editor conflict detected.');
  }

  const currentTimestamp = new Date().toISOString();

  await options.vaultAdapter.write(mapping.htmlPath, sanitizedHtmlSource);
  const sourceStates = await createSourceStates(mapping, options.vaultAdapter);

  await options.richDocumentStore.updateMapping(options.markdownPath, {
    activeSource: 'html',
    conflictState: { status: 'none' },
    sourceStates,
    syncTimestamps: {
      ...mapping.syncTimestamps,
      htmlSyncedAt: currentTimestamp,
      lastSyncedAt: currentTimestamp,
    },
  });
}

export async function syncMarkdownMirror(options: RichDocumentSourceWriteOptions): Promise<void> {
  const sanitizedHtmlSource = sanitizeConvertedHtmlSource(options.htmlSource);
  const mapping = await options.richDocumentStore.getOrCreateMapping(options.markdownPath);

  if (
    await isArchivedMarkdownMissing(
      options.vaultAdapter,
      mapping.markdownPath,
      mapping.lifecycleState
    )
  ) {
    return;
  }

  const currentSourceStates = await createSourceStates(mapping, options.vaultAdapter);
  const sourceChanges = collectChangedSourceStates(mapping.sourceStates, currentSourceStates);

  const markdownChanged = sourceChanges.some((sourceChange) => sourceChange.source === 'markdown');

  const richSourceChanged = hasRichSourceChange(sourceChanges);

  const richFileDeleted = sourceChanges.some(
    (sourceChange) =>
      sourceChange.source !== 'markdown' && sourceChange.currentState?.exists === false
  );

  if (mapping.conflictState.status === 'conflicted') {
    throw new Error('Libre Note Editor conflict is unresolved.');
  }

  if (markdownChanged || richSourceChanged) {
    const conflictState = await createConflictState({
      changedSources: getMarkdownMirrorConflictSources(sourceChanges),
      desktopHtmlSource: sanitizedHtmlSource,
      detectedAt: new Date().toISOString(),
      mapping,
      reason: richFileDeleted ? 'missing-rich-file' : 'multi-source-change',
      vaultAdapter: options.vaultAdapter,
    });

    await options.richDocumentStore.updateMapping(options.markdownPath, {
      conflictState,
      sourceStates: currentSourceStates,
    });

    throw new Error('Libre Note Editor conflict detected.');
  }

  const currentMarkdownSource = await options.vaultAdapter.read(options.markdownPath);
  const currentHtmlSource = sanitizedHtmlSource;
  const markdownMirrorSource = createMarkdownMirrorSource(currentMarkdownSource, currentHtmlSource);

  await options.vaultAdapter.write(options.markdownPath, markdownMirrorSource);
  await updateMarkdownSyncTimestamp(options, mapping);
}
