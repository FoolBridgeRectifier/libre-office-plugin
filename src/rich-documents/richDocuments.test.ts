import { RICH_DOCUMENTS_ROOT_PATH } from './constants';
import {
  createRichDocumentFilePaths,
  createRichDocumentMapping,
  createStableRichDocumentId,
  isPathInsideRichDocumentsRoot,
  serializeRichDocumentMapping,
} from './helpers';
import { createRichDocumentStore } from './richDocuments';
import type { RichDocumentPluginData, RichDocumentVaultAdapter } from './interfaces';

function createPersistenceTarget(pluginData: unknown = null) {
  let savedPluginData: RichDocumentPluginData | null = null;

  return {
    getSavedPluginData: () => savedPluginData,
    target: {
      loadData: jest.fn(async () => pluginData),
      saveData: jest.fn(async (data: RichDocumentPluginData) => {
        savedPluginData = data;
      }),
    },
  };
}

function createVaultAdapter(initialFiles: ReadonlyMap<string, string> = new Map()) {
  const files = new Map(initialFiles);
  const folders = new Set<string>();
  const mkdirCalls: string[] = [];
  const renameCalls: Array<readonly [string, string]> = [];

  for (const filePath of files.keys()) {
    addFolderParents(folders, filePath);
  }

  const adapter: RichDocumentVaultAdapter = {
    exists: jest.fn(
      async (normalizedPath: string) => files.has(normalizedPath) || folders.has(normalizedPath)
    ),
    list: jest.fn(async (normalizedPath: string) => ({
      files: getDirectChildren(files.keys(), normalizedPath),
      folders: getDirectChildren(folders.values(), normalizedPath),
    })),
    mkdir: jest.fn(async (normalizedPath: string) => {
      folders.add(normalizedPath);
      mkdirCalls.push(normalizedPath);
    }),
    read: jest.fn(async (normalizedPath: string) => files.get(normalizedPath) ?? ''),
    rename: jest.fn(async (normalizedPath: string, normalizedNewPath: string) => {
      const fileText = files.get(normalizedPath);
      files.delete(normalizedPath);
      files.set(normalizedNewPath, fileText ?? '');
      renameCalls.push([normalizedPath, normalizedNewPath]);
    }),
    write: jest.fn(async (normalizedPath: string, data: string) => {
      addFolderParents(folders, normalizedPath);
      files.set(normalizedPath, data);
    }),
  };

  return { adapter, files, folders, mkdirCalls, renameCalls };
}

function createStore(pluginData: unknown = null) {
  const persistence = createPersistenceTarget(pluginData);
  const vault = createVaultAdapter();

  const store = createRichDocumentStore({
    createRichDocumentId: () => 'rich-fixed-id',
    getCurrentTimestamp: () => '2026-05-31T12:00:00.000Z',
    lastEditorPlatform: 'desktop',
    persistenceTarget: persistence.target,
    vaultAdapter: vault.adapter,
  });

  return { persistence, store, vault };
}

test('generates stable rich document ids with unique random segments', () => {
  const firstId = createStableRichDocumentId('2026-05-31T12:00:00.000Z', 0.1);
  const secondId = createStableRichDocumentId('2026-05-31T12:00:00.000Z', 0.2);

  expect(firstId).toBe('rich-20260531120000-8va10rq7g3');
  expect(secondId).toBe('rich-20260531120000-hqk21jgew6');
  expect(firstId).not.toBe(secondId);
});

test('creates rich document paths inside the documents root', () => {
  const paths = createRichDocumentFilePaths('../Unsafe Note.md');

  expect(paths.folderPath).toBe(`${RICH_DOCUMENTS_ROOT_PATH}/---Unsafe-Note-md`);
  expect(paths.htmlPath).toBe(`${RICH_DOCUMENTS_ROOT_PATH}/---Unsafe-Note-md/document.html`);
  expect(paths.odtPath).toBe(`${RICH_DOCUMENTS_ROOT_PATH}/---Unsafe-Note-md/document.odt`);

  expect(isPathInsideRichDocumentsRoot(paths.htmlPath)).toBe(true);
  expect(isPathInsideRichDocumentsRoot('../outside/document.html')).toBe(false);
});

test('creates one mapping for a new markdown note and persists the sidecar', async () => {
  const { persistence, store, vault } = createStore();

  const mapping = await store.getOrCreateMapping('Folder/New Note.md');
  const savedPluginData = persistence.getSavedPluginData();

  expect(mapping.markdownPath).toBe('Folder/New Note.md');
  expect(mapping.richDocumentId).toBe('rich-fixed-id');
  expect(mapping.lastEditorPlatform).toBe('desktop');
  expect(savedPluginData?.mappings).toHaveLength(1);

  expect(vault.files.get(`${RICH_DOCUMENTS_ROOT_PATH}/rich-fixed-id/mapping.json`)).toContain(
    'Folder/New Note.md'
  );
});

test('looks mappings up by markdown path and rich document id', async () => {
  const { store } = createStore();
  const mapping = await store.getOrCreateMapping('Lookup.md');

  expect(await store.getMappingByMarkdownPath('Lookup.md')).toBe(mapping);
  expect(await store.getMappingByRichDocumentId('rich-fixed-id')).toBe(mapping);
  expect(await store.getMappingByMarkdownPath('Missing.md')).toBe(null);
});

test('renames markdown paths without changing the stable rich id', async () => {
  const { store } = createStore();
  const mapping = await store.getOrCreateMapping('Folder/Old.md');

  const renamedMapping = await store.renameMapping('Folder/Old.md', 'Renamed/New.md');

  expect(renamedMapping.markdownPath).toBe('Renamed/New.md');
  expect(renamedMapping.richDocumentId).toBe(mapping.richDocumentId);
  expect(await store.getMappingByMarkdownPath('Folder/Old.md')).toBe(null);
});

test('archives existing rich files when a markdown note is deleted', async () => {
  const { store, vault } = createStore();
  const mapping = await store.getOrCreateMapping('Delete Me.md');
  vault.files.set(mapping.htmlPath, '<p>draft</p>');
  vault.files.set(mapping.odtPath, 'odt-bytes');

  const archivedMapping = await store.archiveMapping('Delete Me.md');
  const deleteMappingResult = await store.deleteMapping('Already Deleted.md');

  expect(archivedMapping?.lifecycleState).toBe('archived');
  expect(archivedMapping?.archivedAt).toBe('2026-05-31T12:00:00.000Z');

  expect(archivedMapping?.htmlPath).toBe(
    `${RICH_DOCUMENTS_ROOT_PATH}/rich-fixed-id/archive/20260531120000000-document.html`
  );

  expect(deleteMappingResult).toBe(null);
  expect(vault.renameCalls).toHaveLength(2);
});

test('recovers missing plugin data from rich document mapping sidecars', async () => {
  const mapping = createRichDocumentMapping(
    'Recovered.md',
    'rich-recovered',
    '2026-05-31',
    'unknown'
  );

  const mappingPath = `${RICH_DOCUMENTS_ROOT_PATH}/rich-recovered/mapping.json`;
  const persistence = createPersistenceTarget(null);

  const vault = createVaultAdapter(new Map([[mappingPath, serializeRichDocumentMapping(mapping)]]));

  const store = createRichDocumentStore({
    persistenceTarget: persistence.target,
    vaultAdapter: vault.adapter,
  });

  expect(await store.loadMappings()).toHaveLength(1);

  expect(await store.getMappingByMarkdownPath('Recovered.md')).toMatchObject({
    richDocumentId: 'rich-recovered',
  });

  expect(persistence.getSavedPluginData()?.mappings).toHaveLength(1);
});

test('ignores malformed plugin data and repairs unsafe rich paths', async () => {
  const unsafePluginData = {
    mappings: [
      { markdownPath: 'Broken.md' },
      {
        htmlPath: '../outside.html',
        markdownPath: 'Unsafe.md',
        odtPath: '../outside.odt',
        richDocumentId: '../bad id',
      },
    ],
  };

  const { store } = createStore(unsafePluginData);
  const mappings = await store.loadMappings();

  expect(mappings).toHaveLength(1);
  expect(mappings[0].richDocumentId).toBe('---bad-id');
  expect(mappings[0].htmlPath).toBe(`${RICH_DOCUMENTS_ROOT_PATH}/---bad-id/document.html`);
  expect(mappings[0].conflictState.status).toBe('none');
});

test('keeps duplicate note names in different folders as separate mappings', async () => {
  let idIndex = 0;
  const identifiers = ['rich-first', 'rich-second'];
  const persistence = createPersistenceTarget(null);
  const vault = createVaultAdapter();

  const store = createRichDocumentStore({
    createRichDocumentId: () => identifiers[idIndex++],
    persistenceTarget: persistence.target,
    vaultAdapter: vault.adapter,
  });

  const firstMapping = await store.getOrCreateMapping('A/Note.md');
  const secondMapping = await store.getOrCreateMapping('B/Note.md');

  expect(firstMapping.richDocumentId).toBe('rich-first');
  expect(secondMapping.richDocumentId).toBe('rich-second');
  expect(persistence.getSavedPluginData()?.mappings).toHaveLength(2);
});

test('serializes concurrent creation so one note gets one mapping', async () => {
  const { persistence, store } = createStore();

  const [firstMapping, secondMapping] = await Promise.all([
    store.getOrCreateMapping('Concurrent.md'),
    store.getOrCreateMapping('Concurrent.md'),
  ]);

  expect(firstMapping).toBe(secondMapping);
  expect(persistence.getSavedPluginData()?.mappings).toHaveLength(1);
});

function addFolderParents(folders: Set<string>, filePath: string): void {
  const pathParts = filePath.split('/').slice(0, -1);
  let folderPath = '';

  for (const pathPart of pathParts) {
    folderPath = folderPath ? `${folderPath}/${pathPart}` : pathPart;
    folders.add(folderPath);
  }
}

function getDirectChildren(pathValues: Iterable<string>, parentPath: string): string[] {
  return Array.from(pathValues).filter((pathValue) => getParentPath(pathValue) === parentPath);
}

function getParentPath(pathValue: string): string {
  return pathValue.split('/').slice(0, -1).join('/');
}
