import {
  registerRichDocumentMappingEvents,
  saveRichDocumentHtml,
  syncMarkdownMirror,
} from './helpers';
import { createSourceStates } from './conflicts/helpers';
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
  ).rejects.toThrow('Libre Note Editor conflict detected.');

  expect(vault.files.get(mapping.htmlPath)).toBe('<article>External</article>');
});

test('creates conflict copies when markdown and html changed independently', async () => {
  const baseMapping = createRichDocumentMapping('Note.md', 'rich-note', '2026-06-04', 'desktop');

  const vault = createVaultAdapter(
    new Map([
      ['Note.md', 'Original markdown'],
      [baseMapping.htmlPath, '<article>Original</article>'],
    ])
  );

  const mapping = {
    ...baseMapping,
    sourceStates: await createSourceStates(baseMapping, vault.adapter),
  };

  const richDocumentStore = createStore(mapping);

  vault.files.set('Note.md', 'External markdown');

  await expect(
    saveRichDocumentHtml({
      htmlSource: '<article>Desktop edit</article>',
      markdownPath: 'Note.md',
      previousHtmlSource: '<article>Original</article>',
      richDocumentStore,
      vaultAdapter: vault.adapter,
    })
  ).rejects.toThrow('Libre Note Editor conflict detected.');

  const updatedMapping = await richDocumentStore.getOrCreateMapping('Note.md');

  expect(updatedMapping.conflictState.status).toBe('conflicted');

  if (updatedMapping.conflictState.status === 'conflicted') {
    expect(updatedMapping.conflictState.conflictCopies).toHaveLength(3);
  }

  expect(vault.files.get('Note.md')).toBe('External markdown');
});

test('does not overwrite markdown while conflict is unresolved', async () => {
  const conflictState = {
    changedSources: ['markdown', 'html'] as const,
    conflictCopies: [],
    detectedAt: '2026-06-05',
    reason: 'multi-source-change' as const,
    status: 'conflicted' as const,
  };

  const mapping = {
    ...createRichDocumentMapping('Note.md', 'rich-note', '2026-06-04', 'desktop'),
    conflictState,
  };

  const richDocumentStore = createStore(mapping);
  const vault = createVaultAdapter(new Map([['Note.md', 'External markdown']]));

  await expect(
    syncMarkdownMirror({
      htmlSource: '<article><p>Local HTML</p></article>',
      markdownPath: 'Note.md',
      richDocumentStore,
      vaultAdapter: vault.adapter,
    })
  ).rejects.toThrow('Libre Note Editor conflict is unresolved.');

  expect(vault.files.get('Note.md')).toBe('External markdown');
});

test('stale markdown timestamps with unchanged content do not create conflict', async () => {
  const baseMapping = createRichDocumentMapping('Note.md', 'rich-note', '2026-06-04', 'desktop');

  const vault = createVaultAdapter(
    new Map([
      ['Note.md', 'Old body'],
      [baseMapping.htmlPath, '<article><p>Old body</p></article>'],
    ])
  );

  const mapping = {
    ...baseMapping,
    sourceStates: await createSourceStates(baseMapping, vault.adapter),
  };

  const richDocumentStore = createStore(mapping);

  vault.modifiedTimes.set('Note.md', 500);

  await syncMarkdownMirror({
    htmlSource: '<article><p>New body</p></article>',
    markdownPath: 'Note.md',
    richDocumentStore,
    vaultAdapter: vault.adapter,
  });

  expect(vault.files.get('Note.md')).toBe('New body');
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
