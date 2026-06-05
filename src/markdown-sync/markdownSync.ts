import { HTML_FALLBACK_ACTIVE_SOURCE } from './constants';
import { createSourceStates } from '../conflicts/helpers';
import { convertMarkdownToHtmlWithObsidianRenderer } from './helpers';
import { ensureVaultFolder } from '../rich-documents/helpers/vault/vault';
import { createRichDocumentFilePaths } from '../rich-documents/helpers';
import type {
  FirstMarkdownImportResult,
  MarkdownImportOptions,
  RenderedMarkdownToHtmlOptions,
} from './interfaces';

export async function ensureFirstMarkdownImport(
  options: MarkdownImportOptions
): Promise<FirstMarkdownImportResult> {
  // Existing HTML is treated as the richer source and must not be overwritten by markdown.
  if (await options.vaultAdapter.exists(options.mapping.htmlPath)) {
    return {
      htmlSource: await options.vaultAdapter.read(options.mapping.htmlPath),
      imported: false,
      mapping: options.mapping,
    };
  }

  // Obsidian's vault reader owns note contents; the converter only sees plain markdown text.
  const markdownSource = await options.vaultReader.read(options.markdownFile);

  const renderedMarkdownOptions: RenderedMarkdownToHtmlOptions = {
    ...(options.markdownRenderer ? { markdownRenderer: options.markdownRenderer } : {}),
    sourcePath: options.markdownFile.path,
  };

  const markdownToHtmlResult = await convertMarkdownToHtmlWithObsidianRenderer(
    markdownSource,
    renderedMarkdownOptions
  );

  // A single timestamp keeps the first HTML sync and overall sync markers aligned.
  const currentTimestamp = options.getCurrentTimestamp?.() ?? new Date().toISOString();

  // Rich document files live under the stable rich-document id, not the note filename.
  const richDocumentFilePaths = createRichDocumentFilePaths(options.mapping.richDocumentId);

  // The hidden rich-document folder is created lazily on the first markdown import.
  await ensureVaultFolder(options.vaultAdapter, richDocumentFilePaths.folderPath);
  await options.vaultAdapter.write(options.mapping.htmlPath, markdownToHtmlResult.htmlSource);
  const sourceStates = await createSourceStates(options.mapping, options.vaultAdapter);

  // After import, the rich HTML file becomes the active editable source for this note.
  const importedMapping = await options.richDocumentStore.updateMapping(
    options.mapping.markdownPath,
    {
      activeSource: HTML_FALLBACK_ACTIVE_SOURCE,
      conflictState: { status: 'none' },
      sourceStates,
      syncTimestamps: {
        ...options.mapping.syncTimestamps,
        htmlSyncedAt: currentTimestamp,
        lastSyncedAt: currentTimestamp,
      },
    }
  );

  return {
    htmlSource: markdownToHtmlResult.htmlSource,
    imported: true,
    mapping: importedMapping,
  };
}
