import { createSourceStates } from '../source-state/sourceState';
import {
  getActiveSourceForChoice,
  getSync,
  readOptionalSource,
  readSelectedConflictSource,
  writeDuplicateConflictCopy,
  writeHtmlResolutionSources,
} from './helpers';
import type { ConflictResolutionOptions } from '../../interfaces';

export async function resolveRichDocumentConflict(
  options: ConflictResolutionOptions
): Promise<string | null> {
  const mapping = await options.richDocumentStore.getOrCreateMapping(options.markdownPath);
  const resolvedAt = options.getCurrentTimestamp?.() ?? new Date().toISOString();

  if (mapping.conflictState.status !== 'conflicted') {
    return readOptionalSource(options, mapping.htmlPath);
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

  return htmlSource;
}
