import { createRichDocumentEditorViewOptions } from './options';
import {
  resolveRichDocumentConflict,
  saveRichDocumentHtml,
  syncMarkdownMirror,
} from '../../richDocumentWorkspace';
import { loadRichDocumentHtmlForStore } from '../../rich-html/richHtml';
import { convertMarkdownToHtmlWithObsidianRenderer } from '../../markdown-sync';
import type { TFile } from 'obsidian';

jest.mock('../../richDocumentWorkspace', () => ({
  resolveRichDocumentConflict: jest.fn(async () => '<article>Resolved</article>'),
  saveRichDocumentHtml: jest.fn(async () => undefined),
  syncMarkdownMirror: jest.fn(async () => undefined),
}));

jest.mock('../../rich-html/richHtml', () => ({
  getInitialRichDocumentAutosaveStatus: jest.fn(),
  loadRichDocumentHtmlForStore: jest.fn(async () => '<article>Loaded</article>'),
}));

jest.mock('../../markdown-sync', () => ({
  convertMarkdownToHtmlWithObsidianRenderer: jest.fn(async () => ({
    htmlSource: '<article>Converted</article>',
  })),
  renderMarkdownWithObsidian: jest.fn(),
}));

jest.mock('../../obsidian-links/resolver/resolver', () => ({
  collectObsidianLinkWarningsForApp: jest.fn(() => []),
}));

test('creates HTML load, save, sync, and conflict delegates', async () => {
  const app = { vault: { adapter: {} } } as never;
  const richDocumentStore = { getMappingByMarkdownPath: jest.fn() } as never;

  const options = createRichDocumentEditorViewOptions(app, richDocumentStore, () =>
    createSettings()
  );

  await expect(options.loadImportedHtmlSource({ path: 'Note.md' } as TFile)).resolves.toBe(
    '<article>Loaded</article>'
  );

  await options.saveHtmlSource('Note.md', '<article>Saved</article>', '<article>Old</article>');
  await options.syncMarkdownMirror('Note.md', '<article>Saved</article>');

  await expect(options.resolveConflict('Note.md', 'html')).resolves.toBe(
    '<article>Resolved</article>'
  );

  expect(loadRichDocumentHtmlForStore).toHaveBeenCalledWith(
    app,
    { path: 'Note.md' },
    richDocumentStore
  );

  expect(saveRichDocumentHtml).toHaveBeenCalledWith({
    htmlSource: '<article>Saved</article>',
    markdownPath: 'Note.md',
    previousHtmlSource: '<article>Old</article>',
    richDocumentStore,
    vaultAdapter: {},
  });

  expect(syncMarkdownMirror).toHaveBeenCalledWith({
    htmlSource: '<article>Saved</article>',
    markdownPath: 'Note.md',
    richDocumentStore,
    vaultAdapter: {},
  });

  expect(resolveRichDocumentConflict).toHaveBeenCalledWith(
    expect.objectContaining({
      choice: 'html',
      markdownPath: 'Note.md',
      richDocumentStore,
      vaultAdapter: {},
    })
  );

  const conflictOptions = jest.mocked(resolveRichDocumentConflict).mock.calls[0]?.[0] as {
    markdownToHtmlSource(markdownSource: string, sourcePath: string): Promise<string>;
  };

  await expect(conflictOptions.markdownToHtmlSource('# Title', 'Note.md')).resolves.toBe(
    '<article>Converted</article>'
  );

  expect(convertMarkdownToHtmlWithObsidianRenderer).toHaveBeenCalledWith(
    '# Title',
    expect.objectContaining({ sourcePath: 'Note.md' })
  );
});

function createSettings() {
  return {
    autosaveIntervalSeconds: 5,
    conflictBehavior: 'manual' as const,
    markdownSyncIntervalSeconds: 30,
    pageLayout: 'pageless' as const,
    showMarkdownSourceFallback: true,
  };
}
