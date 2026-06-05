import { createSourceStates } from '../source-state/sourceState';
import {
  getActiveSourceForChoice,
  getSync,
  readOptionalSource,
  readSelectedConflictSource,
  writeDuplicateConflictCopy,
  writeHtmlResolutionSources,
} from './helpers';
import type {
  ConflictResolutionChoice,
  ConflictResolutionOptions,
  ConflictResolutionResult,
} from '../../interfaces';
import type { RichDocumentMapping } from '../../../rich-documents/interfaces';

export function resolveConflictMapping(
  mapping: RichDocumentMapping,
  choice: ConflictResolutionChoice,
  resolvedAt: string
): RichDocumentMapping {
  const activeSource = getActiveSourceForChoice(choice);

  return {
    ...mapping,
    activeSource,
    conflictState: { status: 'none' },
    syncTimestamps: {
      ...mapping.syncTimestamps,
      lastSyncedAt: resolvedAt,
    },
  };
}

export async function resolveRichDocumentConflict(
  options: ConflictResolutionOptions
): Promise<ConflictResolutionResult> {
  const mapping = await options.richDocumentStore.getOrCreateMapping(options.markdownPath);
  const resolvedAt = options.getCurrentTimestamp?.() ?? new Date().toISOString();

  if (mapping.conflictState.status !== 'conflicted') {
    return { htmlSource: await readOptionalSource(options, mapping.htmlPath) };
  }

  if (options.choice === 'duplicate-conflict-copy') {
    await writeDuplicateConflictCopy(mapping, options, resolvedAt);
  }

  const activeSource = getActiveSourceForChoice(options.choice);
  const selectedSource = await readSelectedConflictSource(mapping, options);
  let htmlSource = await readOptionalSource(options, mapping.htmlPath);

  if (options.choice === 'markdown' && selectedSource !== null) {
    await options.vaultAdapter.write(mapping.markdownPath, selectedSource);

    if (options.markdownToHtmlSource) {
      htmlSource = await options.markdownToHtmlSource(selectedSource, mapping.markdownPath);
      await options.vaultAdapter.write(mapping.htmlPath, htmlSource);
    }
  } else if (activeSource === 'html' && selectedSource !== null) {
    htmlSource = selectedSource;
    await writeHtmlResolutionSources(mapping, options, htmlSource);
  } else if (activeSource === 'odt' && selectedSource !== null) {
    await options.vaultAdapter.write(mapping.odtPath, selectedSource);
  }

  const sourceStates = await createSourceStates(mapping, options.vaultAdapter);
  const syncTimestamps = getSync(mapping, activeSource, options.choice, htmlSource, resolvedAt);

  const conflictState = { status: 'none' as const };
  const mappingPatch = { activeSource, conflictState, sourceStates, syncTimestamps };

  await options.richDocumentStore.updateMapping(options.markdownPath, mappingPatch);

  return { htmlSource };
}
