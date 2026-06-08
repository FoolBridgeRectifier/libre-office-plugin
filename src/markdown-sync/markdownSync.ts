import { HTML_FALLBACK_ACTIVE_SOURCE } from './constants';
import { createSourceStates } from '../conflicts';
import { sanitizeConvertedHtmlSourceWithReport } from '../conversion';
import { convertMarkdownToHtmlWithObsidianRenderer } from '.';
import { ensureVaultFolder } from '../rich-documents/vault/vault';
import { createRichDocumentFilePaths } from '../rich-documents/paths/paths';
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
    const existingHtmlSource = await options.vaultAdapter.read(options.mapping.htmlPath);
    const sanitizedExistingHtml = sanitizeConvertedHtmlSourceWithReport(existingHtmlSource);
    let existingMapping = options.mapping;

    if (sanitizedExistingHtml.removedUnsafeContent) {
      await options.vaultAdapter.write(options.mapping.htmlPath, sanitizedExistingHtml.htmlSource);
      const sourceStates = await createSourceStates(options.mapping, options.vaultAdapter);

      existingMapping = await options.richDocumentStore.updateMapping(
        options.mapping.markdownPath,
        {
          sourceStates,
        }
      );
    }

    return {
      htmlSource: sanitizedExistingHtml.htmlSource,
      imported: false,
      mapping: existingMapping,
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

  const sanitizedImportHtml = sanitizeConvertedHtmlSourceWithReport(
    markdownToHtmlResult.htmlSource
  );

  // A single timestamp keeps the first HTML sync and overall sync markers aligned.
  const currentTimestamp = options.getCurrentTimestamp?.() ?? new Date().toISOString();

  // Rich document files live under the stable rich-document id, not the note filename.
  const richDocumentFilePaths = createRichDocumentFilePaths(options.mapping.richDocumentId);

  // The hidden rich-document folder is created lazily on the first markdown import.
  await ensureVaultFolder(options.vaultAdapter, richDocumentFilePaths.folderPath);
  await options.vaultAdapter.write(options.mapping.htmlPath, sanitizedImportHtml.htmlSource);
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
    htmlSource: sanitizedImportHtml.htmlSource,
    imported: true,
    mapping: importedMapping,
  };
}
