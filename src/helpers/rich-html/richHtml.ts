import { loadRichDocumentHtml } from '../../helpers';
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
