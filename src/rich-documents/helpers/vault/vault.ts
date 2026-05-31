import { RICH_DOCUMENTS_ROOT_PATH, RICH_DOCUMENT_MAPPING_FILE_NAME } from '../../constants';
import { createArchiveFilePath, createRichDocumentFilePaths } from '../paths/paths';
import { parseRichDocumentMapping, serializeRichDocumentMapping } from '../plugin-data/pluginData';
import type { RichDocumentMapping, RichDocumentVaultAdapter } from '../../interfaces';

export async function ensureVaultFolder(
  vaultAdapter: RichDocumentVaultAdapter,
  folderPath: string
): Promise<void> {
  const folderParts = folderPath.split('/');
  let currentFolderPath = '';

  for (const folderPart of folderParts) {
    currentFolderPath = currentFolderPath ? `${currentFolderPath}/${folderPart}` : folderPart;

    if (!(await vaultAdapter.exists(currentFolderPath))) {
      await vaultAdapter.mkdir(currentFolderPath);
    }
  }
}

export async function persistMappingSidecar(
  vaultAdapter: RichDocumentVaultAdapter,
  mapping: RichDocumentMapping
): Promise<void> {
  const richDocumentFilePaths = createRichDocumentFilePaths(mapping.richDocumentId);

  await ensureVaultFolder(vaultAdapter, richDocumentFilePaths.folderPath);

  await vaultAdapter.write(
    richDocumentFilePaths.mappingPath,
    serializeRichDocumentMapping(mapping)
  );
}

export async function recoverMappingsFromSidecars(
  vaultAdapter: RichDocumentVaultAdapter
): Promise<ReadonlyArray<RichDocumentMapping>> {
  if (!(await vaultAdapter.exists(RICH_DOCUMENTS_ROOT_PATH))) {
    return [];
  }

  const richDocumentFolderList = await vaultAdapter.list(RICH_DOCUMENTS_ROOT_PATH);

  const recoveredMappings = await Promise.all(
    richDocumentFolderList.folders.map((folderPath) =>
      readRecoveredMapping(vaultAdapter, `${folderPath}/${RICH_DOCUMENT_MAPPING_FILE_NAME}`)
    )
  );

  return recoveredMappings.filter((mapping) => mapping !== null);
}

export async function archiveVaultFileIfPresent(
  vaultAdapter: RichDocumentVaultAdapter,
  filePath: string,
  timestamp: string
): Promise<string> {
  if (!(await vaultAdapter.exists(filePath))) {
    return filePath;
  }

  const archivedPath = createArchiveFilePath(filePath, timestamp);
  await ensureVaultFolder(vaultAdapter, archivedPath.split('/').slice(0, -1).join('/'));
  await vaultAdapter.rename(filePath, archivedPath);

  return archivedPath;
}

export async function archiveRichDocumentFiles(
  vaultAdapter: RichDocumentVaultAdapter,
  mapping: RichDocumentMapping,
  timestamp: string
): Promise<readonly [string, string]> {
  const htmlPath = await archiveVaultFileIfPresent(vaultAdapter, mapping.htmlPath, timestamp);
  const odtPath = await archiveVaultFileIfPresent(vaultAdapter, mapping.odtPath, timestamp);

  return [htmlPath, odtPath];
}

async function readRecoveredMapping(
  vaultAdapter: RichDocumentVaultAdapter,
  mappingPath: string
): Promise<RichDocumentMapping | null> {
  if (!(await vaultAdapter.exists(mappingPath))) {
    return null;
  }

  return parseRichDocumentMapping(await vaultAdapter.read(mappingPath));
}
