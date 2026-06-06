import { RICH_DOCUMENTS_ROOT_PATH } from './constants';
import { createRichDocumentMapping, serializeRichDocumentMapping } from './helpers';
import { createRichDocumentStore } from './richDocuments';
import { createPersistenceTarget, createStore, createVaultAdapter } from './utils';

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
  const repairedMapping = mappings[0];

  expect(mappings).toHaveLength(1);
  expect(repairedMapping?.richDocumentId).toBe('---bad-id');
  expect(repairedMapping?.htmlPath).toBe(`${RICH_DOCUMENTS_ROOT_PATH}/---bad-id/document.html`);
  expect(repairedMapping?.conflictState.status).toBe('none');
});

test('drops unsafe persisted conflict copy paths during plugin data normalization', async () => {
  const unsafePluginData = {
    mappings: [
      {
        conflictState: {
          changedSources: ['html'],
          conflictCopies: [
            {
              createdAt: '2026-06-06T12:00:00.000Z',
              path: '../outside.html',
              source: 'html',
            },
            {
              createdAt: '2026-06-06T12:00:00.000Z',
              path: `${RICH_DOCUMENTS_ROOT_PATH}/rich-safe/conflicts/copy.html`,
              source: 'html',
            },
          ],
          detectedAt: '2026-06-06T12:00:00.000Z',
          reason: 'multi-source-change',
          status: 'conflicted',
        },
        markdownPath: 'Unsafe Conflict.md',
        richDocumentId: 'rich-safe',
      },
    ],
  };

  const { store } = createStore(unsafePluginData);
  const mapping = (await store.loadMappings())[0];

  expect(mapping?.conflictState.status).toBe('conflicted');

  if (mapping?.conflictState.status === 'conflicted') {
    expect(mapping.conflictState.conflictCopies).toHaveLength(1);
    expect(mapping.conflictState.conflictCopies[0]?.path).toBe(
      `${RICH_DOCUMENTS_ROOT_PATH}/rich-safe/conflicts/copy.html`
    );
  }
});

test('keeps duplicate note names in different folders as separate mappings', async () => {
  let idIndex = 0;
  const identifiers = ['rich-first', 'rich-second'];
  const persistence = createPersistenceTarget(null);
  const vault = createVaultAdapter();

  const store = createRichDocumentStore({
    createRichDocumentId: () => identifiers[idIndex++] ?? 'rich-extra',
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
