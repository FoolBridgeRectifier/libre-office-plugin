import { CONFLICTS_FOLDER_NAME } from '../constants';
import type { ConflictCreationOptions, ConflictSourceCopyRequest } from '../interfaces';
import type { RichDocumentConflictCopy } from '../../rich-documents/interfaces';

function getFileExtension(filePath: string): string {
  const fileName = filePath.split('/').pop() ?? filePath;
  const extensionStart = fileName.lastIndexOf('.');

  return extensionStart === -1 ? '.txt' : fileName.slice(extensionStart);
}

function getConflictFolderPath(mapping: ConflictSourceCopyRequest['mapping']): string {
  return mapping.htmlPath.split('/').slice(0, -1).join('/') + `/${CONFLICTS_FOLDER_NAME}`;
}

export function createConflictCopyPath(
  mapping: ConflictSourceCopyRequest['mapping'],
  sourcePath: string,
  source: ConflictSourceCopyRequest['source'],
  detectedAt: string
): string {
  const safeTimestamp = detectedAt.replace(/[^0-9]/g, '') || 'current';
  const safeSource = source.replace(/[^a-zA-Z0-9_-]/g, '-');

  return `${getConflictFolderPath(mapping)}/${safeTimestamp}-${safeSource}${getFileExtension(
    sourcePath
  )}`;
}

async function writeConflictCopy(
  request: ConflictSourceCopyRequest
): Promise<RichDocumentConflictCopy> {
  const folderPath = getConflictFolderPath(request.mapping);

  const copyPath = createConflictCopyPath(
    request.mapping,
    request.sourcePath,
    request.source,
    request.detectedAt
  );

  if (!(await request.vaultAdapter.exists(folderPath))) {
    await request.vaultAdapter.mkdir(folderPath);
  }

  await request.vaultAdapter.write(copyPath, request.content);

  return { createdAt: request.detectedAt, path: copyPath, source: request.source };
}

export async function createConflictState(options: ConflictCreationOptions) {
  const conflictCopies: RichDocumentConflictCopy[] = [];

  await copyExistingSource(options, 'markdown', options.mapping.markdownPath, conflictCopies);
  await copyExistingSource(options, 'html', options.mapping.htmlPath, conflictCopies);
  await copyExistingSource(options, 'odt', options.mapping.odtPath, conflictCopies);

  if (options.desktopHtmlSource !== undefined) {
    conflictCopies.push(
      await writeConflictCopy({
        content: options.desktopHtmlSource,
        detectedAt: options.detectedAt,
        mapping: options.mapping,
        source: 'desktop',
        sourcePath: options.mapping.htmlPath,
        vaultAdapter: options.vaultAdapter,
      })
    );
  }

  return {
    changedSources: options.changedSources,
    conflictCopies,
    detectedAt: options.detectedAt,
    reason: options.reason,
    status: 'conflicted' as const,
  };
}

async function copyExistingSource(
  options: ConflictCreationOptions,
  source: RichDocumentConflictCopy['source'],
  sourcePath: string,
  conflictCopies: RichDocumentConflictCopy[]
): Promise<void> {
  if (!(await options.vaultAdapter.exists(sourcePath))) {
    return;
  }

  conflictCopies.push(
    await writeConflictCopy({
      content: await options.vaultAdapter.read(sourcePath),
      detectedAt: options.detectedAt,
      mapping: options.mapping,
      source,
      sourcePath,
      vaultAdapter: options.vaultAdapter,
    })
  );
}
