import {
  RICH_DOCUMENTS_ROOT_PATH,
  RICH_DOCUMENT_ARCHIVE_FOLDER_NAME,
  RICH_DOCUMENT_HTML_FILE_NAME,
  RICH_DOCUMENT_ID_PREFIX,
  RICH_DOCUMENT_MAPPING_FILE_NAME,
} from '../constants';
import type { RichDocumentFilePaths } from '../interfaces';

export function createRichDocumentFilePaths(richDocumentId: string): RichDocumentFilePaths {
  // Sanitize before path construction so ids cannot escape the hidden document root.
  const safeRichDocumentId = sanitizeRichDocumentId(richDocumentId);
  const folderPath = `${RICH_DOCUMENTS_ROOT_PATH}/${safeRichDocumentId}`;

  return {
    folderPath,
    htmlPath: `${folderPath}/${RICH_DOCUMENT_HTML_FILE_NAME}`,
    mappingPath: `${folderPath}/${RICH_DOCUMENT_MAPPING_FILE_NAME}`,
  };
}

export function createArchiveFilePath(filePath: string, timestamp: string): string {
  // Archive files sit beside the live rich files so recovery can still inspect one document folder.
  const pathParts = filePath.split('/');
  const fileName = pathParts[pathParts.length - 1];
  const folderPath = pathParts.slice(0, -1).join('/');
  const safeTimestamp = timestamp.replace(/[^0-9]/g, '') || 'archived';

  return `${folderPath}/${RICH_DOCUMENT_ARCHIVE_FOLDER_NAME}/${safeTimestamp}-${fileName}`;
}

export function isPathInsideRichDocumentsRoot(filePath: string): boolean {
  // Persisted paths are only trusted if they stay inside our hidden plugin document area.
  return (
    filePath === RICH_DOCUMENTS_ROOT_PATH || filePath.startsWith(`${RICH_DOCUMENTS_ROOT_PATH}/`)
  );
}

export function sanitizeRichDocumentId(richDocumentId: string): string {
  // Keep ids filesystem-safe across Windows, mobile, and sync providers.
  const sanitizedId = richDocumentId.replace(/[^a-zA-Z0-9_-]/g, '-');

  return sanitizedId.length > 0 ? sanitizedId : `${RICH_DOCUMENT_ID_PREFIX}-invalid`;
}
