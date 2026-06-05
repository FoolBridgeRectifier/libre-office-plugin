import {
  registerRichDocumentMappingEvents,
  saveRichDocumentHtml,
  syncMarkdownMirror,
} from './helpers';
import { createRichDocumentMapping } from './rich-documents/helpers';
import { createStore, createVaultAdapter } from './markdown-sync/utils';
import type { RichDocumentStore } from './rich-documents/interfaces';

function createStoreMock(): RichDocumentStore {
  return {
    archiveMapping: jest.fn(async () => null),
    deleteMapping: jest.fn(async () => null),
    getMappingByMarkdownPath: jest.fn(async () => null),
    getMappingByRichDocumentId: jest.fn(async () => null),
    getOrCreateMapping: jest.fn(),
    loadMappings: jest.fn(async () => []),
    recoverMappings: jest.fn(async () => []),
    renameMapping: jest.fn(),
    updateMapping: jest.fn(),
  };
}

function createPluginMock() {
  type VaultEventHandler = (file: { readonly path: string }, previousPath?: string) => void;

  const eventHandlers = new Map<string, VaultEventHandler>();

  return {
    eventHandlers,
    plugin: {
      app: {
        vault: {
          on: jest.fn((eventName: string, callback: VaultEventHandler) => {
            eventHandlers.set(eventName, callback);

            return { id: eventName };
          }),
        },
      },
      registerEvent: jest.fn(),
    },
  };
}

test('renames rich document mappings when markdown files are renamed', () => {
  const richDocumentStore = createStoreMock();
  const { eventHandlers, plugin } = createPluginMock();

  registerRichDocumentMappingEvents(plugin, richDocumentStore);
  eventHandlers.get('rename')?.({ path: 'Folder/New.md' }, 'Folder/Old.md');

  expect(richDocumentStore.renameMapping).toHaveBeenCalledWith('Folder/Old.md', 'Folder/New.md');
  expect(richDocumentStore.archiveMapping).not.toHaveBeenCalled();
});

test('archives rich document mappings when markdown files are renamed away', () => {
  const richDocumentStore = createStoreMock();
  const { eventHandlers, plugin } = createPluginMock();

  registerRichDocumentMappingEvents(plugin, richDocumentStore);
  eventHandlers.get('rename')?.({ path: 'Folder/New.canvas' }, 'Folder/Old.md');

  expect(richDocumentStore.archiveMapping).toHaveBeenCalledWith('Folder/Old.md');
  expect(richDocumentStore.renameMapping).not.toHaveBeenCalled();
});

test('deletes rich document mappings only for deleted markdown files', () => {
  const richDocumentStore = createStoreMock();
  const { eventHandlers, plugin } = createPluginMock();

  registerRichDocumentMappingEvents(plugin, richDocumentStore);
  eventHandlers.get('delete')?.({ path: 'Folder/Deleted.md' });
  eventHandlers.get('delete')?.({ path: 'Folder/Deleted.png' });

  expect(richDocumentStore.deleteMapping).toHaveBeenCalledTimes(1);
  expect(richDocumentStore.deleteMapping).toHaveBeenCalledWith('Folder/Deleted.md');
});

test('does not blindly overwrite externally changed html source', async () => {
  const mapping = createRichDocumentMapping('Note.md', 'rich-note', '2026-06-04', 'desktop');
  const richDocumentStore = createStore(mapping);
  const vault = createVaultAdapter(new Map([[mapping.htmlPath, '<article>External</article>']]));

  await expect(
    saveRichDocumentHtml({
      htmlSource: '<article>Local</article>',
      markdownPath: 'Note.md',
      previousHtmlSource: '<article>Previous</article>',
      richDocumentStore,
      vaultAdapter: vault.adapter,
    })
  ).rejects.toThrow('HTML source changed outside Libre Note Editor.');

  expect(vault.files.get(mapping.htmlPath)).toBe('<article>External</article>');
});

test('syncs markdown mirror while preserving frontmatter', async () => {
  const mapping = createRichDocumentMapping('Note.md', 'rich-note', '2026-06-04', 'desktop');
  const richDocumentStore = createStore(mapping);

  const vault = createVaultAdapter(new Map([['Note.md', '---\ntags: [libre]\n---\n\nOld body']]));

  await syncMarkdownMirror({
    htmlSource: '<article><h1>Title</h1><p>Body with <strong>bold</strong>.</p></article>',
    markdownPath: 'Note.md',
    richDocumentStore,
    vaultAdapter: vault.adapter,
  });

  expect(vault.files.get('Note.md')).toBe(
    '---\ntags: [libre]\n---\n\n# Title\n\nBody with **bold**.'
  );
});
