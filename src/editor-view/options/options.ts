import {
  resolveRichDocumentConflict,
  saveRichDocumentHtml,
  syncMarkdownMirror,
} from '../../richDocumentWorkspace';
import {
  getInitialRichDocumentAutosaveStatus,
  loadRichDocumentHtmlForStore,
} from '../../rich-html/richHtml';
import {
  convertMarkdownToHtmlWithObsidianRenderer,
  renderMarkdownWithObsidian,
} from '../../markdown-sync';
import { collectObsidianLinkWarningsForApp } from '../../obsidian-links/resolver/resolver';
import { secondsToMilliseconds } from '../../settings';
import { openExternalUrl, openInternalLinkTarget, openTagSearch } from './helpers';
import type { EditorViewOptions } from '../interfaces';
import type { App } from 'obsidian';
import type { RichDocumentStore } from '../../rich-documents/interfaces';
import type { LibreNoteEditorSettings } from '../../settings/interfaces';

export function createRichDocumentEditorViewOptions(
  app: App,
  richDocumentStore: RichDocumentStore,
  getSettings: () => LibreNoteEditorSettings
): EditorViewOptions {
  const settings = getSettings();

  return {
    getPageLayout: () => getSettings().pageLayout,
    htmlAutosaveIntervalMs: secondsToMilliseconds(settings.autosaveIntervalSeconds),
    markdownSyncIntervalMs: secondsToMilliseconds(settings.markdownSyncIntervalSeconds),
    getInitialAutosaveStatus: (file) =>
      getInitialRichDocumentAutosaveStatus(file, richDocumentStore),
    getLinkWarnings: (markdownPath, htmlSource) =>
      collectObsidianLinkWarningsForApp(app, markdownPath, htmlSource),
    loadImportedHtmlSource: (file) => loadRichDocumentHtmlForStore(app, file, richDocumentStore),
    navigateInternalLink: (target, sourcePath) => {
      void openInternalLinkTarget(app, target, sourcePath);
    },
    navigateTag: (tagText) => openTagSearch(app, tagText),
    openExternalLink: (url) => {
      void openExternalUrl(url);
    },
    resolveConflict: async (markdownPath, choice) => {
      return resolveRichDocumentConflict({
        choice,
        markdownPath,
        markdownToHtmlSource: (markdownSource, sourcePath) =>
          convertMarkdownSourceToHtml(app, markdownSource, sourcePath),
        richDocumentStore,
        vaultAdapter: app.vault.adapter,
      });
    },
    saveHtmlSource: (markdownPath, htmlSource, previousHtmlSource) =>
      saveRichDocumentHtml({
        htmlSource,
        markdownPath,
        previousHtmlSource,
        richDocumentStore,
        vaultAdapter: app.vault.adapter,
      }),
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
  const renderResult = await convertMarkdownToHtmlWithObsidianRenderer(markdownSource, {
    markdownRenderer: (bodyMarkdown, containerElement, renderedSourcePath) =>
      renderMarkdownWithObsidian(app, bodyMarkdown, containerElement, renderedSourcePath),
    sourcePath,
  });

  return renderResult.htmlSource;
}
