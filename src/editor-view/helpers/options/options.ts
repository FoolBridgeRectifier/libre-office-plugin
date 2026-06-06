import {
  resolveRichDocumentConflict,
  saveRichDocumentHtml,
  syncMarkdownMirror,
} from '../../../helpers';
import {
  createDefaultDesktopConversionRuntime,
  ensureDesktopOdtSource,
  syncDesktopOdtSave,
} from '../../../conversion/conversion';
import {
  getInitialRichDocumentAutosaveStatus,
  loadRichDocumentHtmlForStore,
} from '../../../helpers/rich-html/richHtml';
import {
  convertMarkdownToHtmlWithObsidianRenderer,
  renderMarkdownWithObsidian,
} from '../../../markdown-sync/helpers';
import { collectObsidianLinkWarningsForApp } from '../../../obsidian-links/helpers/resolver/resolver';
import type { EditorViewOptions } from '../../interfaces';
import type { App } from 'obsidian';
import type { RichDocumentStore } from '../../../rich-documents/interfaces';

export function createRichDocumentEditorViewOptions(
  app: App,
  richDocumentStore: RichDocumentStore,
  getOfficeRuntimeSetupState: NonNullable<EditorViewOptions['getOfficeRuntimeSetupState']>
): EditorViewOptions {
  return {
    getOfficeRuntimeSetupState,
    getInitialAutosaveStatus: (file) =>
      getInitialRichDocumentAutosaveStatus(file, richDocumentStore),
    getLinkWarnings: (markdownPath, htmlSource) =>
      collectObsidianLinkWarningsForApp(app, markdownPath, htmlSource),
    loadImportedHtmlSource: (file) => loadRichDocumentHtmlForStore(app, file, richDocumentStore),
    prepareDesktopSource: async (file) => {
      const mapping = await richDocumentStore.getMappingByMarkdownPath(file.path);
      const runtime = await createDefaultDesktopConversionRuntime(getOfficeRuntimeSetupState());

      if (!mapping || !runtime) {
        return;
      }

      await ensureDesktopOdtSource({
        mapping,
        richDocumentStore,
        runtime,
        vaultAdapter: app.vault.adapter,
      });
    },
    resolveConflict: async (markdownPath, choice) => {
      const result = await resolveRichDocumentConflict({
        choice,
        markdownPath,
        markdownToHtmlSource: (markdownSource, sourcePath) =>
          convertMarkdownSourceToHtml(app, markdownSource, sourcePath),
        richDocumentStore,
        vaultAdapter: app.vault.adapter,
      });

      return result.htmlSource;
    },
    saveHtmlSource: (markdownPath, htmlSource, previousHtmlSource) =>
      saveRichDocumentHtml({
        htmlSource,
        markdownPath,
        previousHtmlSource,
        richDocumentStore,
        vaultAdapter: app.vault.adapter,
      }),
    syncDesktopSource: async (file) => {
      const mapping = await richDocumentStore.getMappingByMarkdownPath(file.path);
      const runtime = await createDefaultDesktopConversionRuntime(getOfficeRuntimeSetupState());

      if (!mapping || !runtime) {
        return null;
      }

      return syncDesktopOdtSave({
        mapping,
        richDocumentStore,
        runtime,
        vaultAdapter: app.vault.adapter,
      });
    },
    syncMarkdownMirror: (markdownPath, htmlSource) =>
      syncMarkdownMirror({
        htmlSource,
        markdownPath,
        richDocumentStore,
        vaultAdapter: app.vault.adapter,
      }),
  };
}

async function convertMarkdownSourceToHtml(
  app: App,
  markdownSource: string,
  sourcePath: string
): Promise<string> {
  const conversionResult = await convertMarkdownToHtmlWithObsidianRenderer(markdownSource, {
    markdownRenderer: (bodyMarkdown, containerElement, renderedSourcePath) =>
      renderMarkdownWithObsidian(app, bodyMarkdown, containerElement, renderedSourcePath),
    sourcePath,
  });

  return conversionResult.htmlSource;
}
