import { registerRichDocumentMappingEvents } from './helpers';
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
