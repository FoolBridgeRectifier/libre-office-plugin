import { loadRichDocumentHtml } from '../../helpers';
import type { AutosaveStatus } from '../../autosave/interfaces';
import type { App, TFile } from 'obsidian';
import type { RichDocumentStore } from '../../rich-documents/interfaces';

export async function loadRichDocumentHtmlForStore(
  app: App,
  file: TFile | null,
  richDocumentStore: RichDocumentStore | null
) {
  if (!file || !richDocumentStore) {
    return null;
  }

  return loadRichDocumentHtml({
    app,
    file,
    richDocumentStore,
  });
}

export async function getInitialRichDocumentAutosaveStatus(
  file: TFile,
  richDocumentStore: RichDocumentStore | null
): Promise<AutosaveStatus> {
  const mapping = await richDocumentStore?.getMappingByMarkdownPath(file.path);

  return mapping?.conflictState.status === 'conflicted' ? 'conflicted' : 'saved';
}
