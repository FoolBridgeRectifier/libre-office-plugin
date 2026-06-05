import { createMarkdownMirrorSource } from '../../autosave/helpers';
import {
  collectChangedSourceStates,
  createConflictState,
  createSourceStates,
  hasSourceStateChanged,
} from '../../conflicts/helpers';
import {
  getChangedSources,
  getMarkdownMirrorConflictSources,
  hasExternalHtmlChange,
  hasIndependentMarkdownAndHtmlChanges,
  updateMarkdownSyncTimestamp,
} from './helpers';
import type { RichDocumentHtmlSaveOptions, RichDocumentSourceWriteOptions } from '../../interfaces';

export async function saveRichDocumentHtml(options: RichDocumentHtmlSaveOptions): Promise<void> {
  const mapping = await options.richDocumentStore.getOrCreateMapping(options.markdownPath);
  const currentSourceStates = await createSourceStates(mapping, options.vaultAdapter);

  const markdownChanged = hasSourceStateChanged(
    mapping.sourceStates.markdown,
    currentSourceStates.markdown
  );

  const htmlChanged = await hasExternalHtmlChange(
    options.vaultAdapter,
    mapping.htmlPath,
    options.previousHtmlSource
  );

  const richFileDeleted =
    mapping.sourceStates.html?.exists === true && currentSourceStates.html?.exists === false;

  if (mapping.conflictState.status === 'conflicted') {
    throw new Error('Libre Note Editor conflict is unresolved.');
  }

  if (
    htmlChanged ||
    richFileDeleted ||
    hasIndependentMarkdownAndHtmlChanges(markdownChanged, options)
  ) {
    const conflictState = await createConflictState({
      changedSources: getChangedSources(markdownChanged, htmlChanged || richFileDeleted),
      desktopHtmlSource: options.htmlSource,
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

  await options.vaultAdapter.write(mapping.htmlPath, options.htmlSource);
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
  const mapping = await options.richDocumentStore.getOrCreateMapping(options.markdownPath);
  const currentSourceStates = await createSourceStates(mapping, options.vaultAdapter);
  const sourceChanges = collectChangedSourceStates(mapping.sourceStates, currentSourceStates);
  const markdownChanged = sourceChanges.some((sourceChange) => sourceChange.source === 'markdown');

  const richFileDeleted = sourceChanges.some(
    (sourceChange) =>
      sourceChange.source !== 'markdown' && sourceChange.currentState?.exists === false
  );

  if (mapping.conflictState.status === 'conflicted') {
    throw new Error('Libre Note Editor conflict is unresolved.');
  }

  if (markdownChanged || richFileDeleted) {
    const conflictState = await createConflictState({
      changedSources: getMarkdownMirrorConflictSources(sourceChanges),
      desktopHtmlSource: options.htmlSource,
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
  const currentHtmlSource = options.htmlSource;
  const markdownMirrorSource = createMarkdownMirrorSource(currentMarkdownSource, currentHtmlSource);

  await options.vaultAdapter.write(options.markdownPath, markdownMirrorSource);
  await updateMarkdownSyncTimestamp(options, mapping);
}
