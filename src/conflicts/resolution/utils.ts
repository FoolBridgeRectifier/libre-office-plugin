import { createConflictCopyPath } from '../copies/copies';
import { createMarkdownMirrorSource } from '../../autosave';
import type { ConflictResolutionChoice, ConflictResolutionOptions } from '../interfaces';
import type {
  RichDocumentActiveSource,
  RichDocumentConflictCopySource,
  RichDocumentMapping,
  RichDocumentSyncTimestamps,
} from '../../rich-documents/interfaces';

export function getActiveSourceForChoice(
  choice: ConflictResolutionChoice
): RichDocumentActiveSource {
  if (choice === 'desktop' || choice === 'mobile' || choice === 'duplicate-conflict-copy') {
    return 'html';
  }

  return choice;
}

function getConflictCopySources(
  choice: ConflictResolutionChoice
): ReadonlyArray<RichDocumentConflictCopySource> {
  switch (choice) {
    case 'desktop':
      return ['desktop', 'html'];
    case 'mobile':
    case 'html':
      return ['html', 'desktop'];
    case 'markdown':
      return ['markdown'];
    case 'odt':
      return ['odt'];
    case 'duplicate-conflict-copy':
      return ['html', 'desktop'];
  }
}

export async function readOptionalSource(
  options: ConflictResolutionOptions,
  sourcePath: string
): Promise<string | null> {
  return (await options.vaultAdapter.exists(sourcePath))
    ? options.vaultAdapter.read(sourcePath)
    : null;
}

export async function readSelectedConflictSource(
  mapping: RichDocumentMapping,
  options: ConflictResolutionOptions
): Promise<string | null> {
  if (mapping.conflictState.status !== 'conflicted') {
    return null;
  }

  for (const source of getConflictCopySources(options.choice)) {
    const conflictCopy = mapping.conflictState.conflictCopies.find(
      (candidateConflictCopy) => candidateConflictCopy.source === source
    );

    if (conflictCopy && (await options.vaultAdapter.exists(conflictCopy.path))) {
      return options.vaultAdapter.read(conflictCopy.path);
    }
  }

  return null;
}

export async function writeDuplicateConflictCopy(
  mapping: RichDocumentMapping,
  options: ConflictResolutionOptions,
  resolvedAt: string
): Promise<void> {
  const htmlSource = await readOptionalSource(options, mapping.htmlPath);

  if (htmlSource === null) {
    return;
  }

  const conflictCopyPath = createConflictCopyPath(mapping, mapping.htmlPath, 'desktop', resolvedAt);
  const conflictFolderPath = conflictCopyPath.split('/').slice(0, -1).join('/');

  if (!(await options.vaultAdapter.exists(conflictFolderPath))) {
    await options.vaultAdapter.mkdir(conflictFolderPath);
  }

  await options.vaultAdapter.write(conflictCopyPath, htmlSource);
}

export async function writeHtmlResolutionSources(
  mapping: RichDocumentMapping,
  options: ConflictResolutionOptions,
  htmlSource: string
): Promise<void> {
  await options.vaultAdapter.write(mapping.htmlPath, htmlSource);

  const markdownSource = (await readOptionalSource(options, mapping.markdownPath)) ?? '';

  await options.vaultAdapter.write(
    mapping.markdownPath,
    createMarkdownMirrorSource(markdownSource, htmlSource)
  );
}

export function getSync(
  mapping: RichDocumentMapping,
  activeSource: RichDocumentActiveSource,
  choice: ConflictResolutionChoice,
  htmlSource: string | null,
  resolvedAt: string
): RichDocumentSyncTimestamps {
  const htmlSyncedAt =
    activeSource === 'html' || (choice === 'markdown' && htmlSource !== null)
      ? resolvedAt
      : mapping.syncTimestamps.htmlSyncedAt;

  const markdownSyncedAt =
    activeSource === 'markdown' || activeSource === 'html'
      ? resolvedAt
      : mapping.syncTimestamps.markdownSyncedAt;

  return {
    ...mapping.syncTimestamps,
    htmlSyncedAt,
    lastSyncedAt: resolvedAt,
    markdownSyncedAt,
    odtSyncedAt: activeSource === 'odt' ? resolvedAt : mapping.syncTimestamps.odtSyncedAt,
  };
}
