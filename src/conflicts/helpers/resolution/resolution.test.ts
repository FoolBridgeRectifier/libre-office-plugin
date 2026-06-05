import { resolveConflictMapping, resolveRichDocumentConflict } from './resolution';
import { createRichDocumentMapping } from '../../../rich-documents/helpers';
import { createStore, createVaultAdapter } from '../../../markdown-sync/utils';
import type {
  RichDocumentConflictCopy,
  RichDocumentMapping,
} from '../../../rich-documents/interfaces';

function createConflictedMapping(
  conflictCopies: ReadonlyArray<RichDocumentConflictCopy>
): RichDocumentMapping {
  return {
    ...createRichDocumentMapping('Note.md', 'rich-note', '2026-06-04', 'desktop'),
    conflictState: {
      changedSources: ['markdown', 'html'] as const,
      conflictCopies,
      detectedAt: '2026-06-05',
      reason: 'multi-source-change',
      status: 'conflicted',
    },
  };
}

function createConflictCopy(
  path: string,
  source: RichDocumentConflictCopy['source']
): RichDocumentConflictCopy {
  return {
    createdAt: '2026-06-05',
    path,
    source,
  };
}

test('conflict resolution updates selected source and clears conflict state', () => {
  const mapping = createConflictedMapping([]);

  const resolvedMapping = resolveConflictMapping(mapping, 'mobile', '2026-06-06');

  expect(resolvedMapping.activeSource).toBe('html');
  expect(resolvedMapping.conflictState.status).toBe('none');
  expect(resolvedMapping.syncTimestamps.lastSyncedAt).toBe('2026-06-06');
});

test('desktop conflict choice writes desktop html and markdown mirror', async () => {
  const mapping = createConflictedMapping([
    createConflictCopy('conflicts/desktop.html', 'desktop'),
    createConflictCopy('conflicts/html.html', 'html'),
  ]);

  const richDocumentStore = createStore(mapping);

  const vault = createVaultAdapter(
    new Map([
      ['Note.md', '---\ntags: [libre]\n---\n\nExternal markdown'],
      [mapping.htmlPath, '<article><p>Mobile</p></article>'],
      ['conflicts/desktop.html', '<article><h1>Desktop</h1></article>'],
      ['conflicts/html.html', '<article><h1>Mobile</h1></article>'],
    ])
  );

  const result = await resolveRichDocumentConflict({
    choice: 'desktop',
    getCurrentTimestamp: () => '2026-06-06',
    markdownPath: 'Note.md',
    richDocumentStore,
    vaultAdapter: vault.adapter,
  });

  const updatedMapping = await richDocumentStore.getOrCreateMapping('Note.md');

  expect(result.htmlSource).toBe('<article><h1>Desktop</h1></article>');
  expect(vault.files.get(mapping.htmlPath)).toBe('<article><h1>Desktop</h1></article>');
  expect(vault.files.get('Note.md')).toBe('---\ntags: [libre]\n---\n\n# Desktop');

  expect(updatedMapping.activeSource).toBe('html');
  expect(updatedMapping.conflictState.status).toBe('none');
  expect(updatedMapping.syncTimestamps.markdownSyncedAt).toBe('2026-06-06');
});

test('markdown conflict choice converts selected markdown into html source', async () => {
  const mapping = createConflictedMapping([
    createConflictCopy('conflicts/markdown.md', 'markdown'),
  ]);

  const richDocumentStore = createStore(mapping);

  const vault = createVaultAdapter(
    new Map([
      ['Note.md', 'External markdown'],
      [mapping.htmlPath, '<article><p>HTML</p></article>'],
      ['conflicts/markdown.md', '# Kept markdown'],
    ])
  );

  const result = await resolveRichDocumentConflict({
    choice: 'markdown',
    getCurrentTimestamp: () => '2026-06-06',
    markdownPath: 'Note.md',
    markdownToHtmlSource: jest.fn(async (markdownSource) => `<article>${markdownSource}</article>`),
    richDocumentStore,
    vaultAdapter: vault.adapter,
  });

  const updatedMapping = await richDocumentStore.getOrCreateMapping('Note.md');

  expect(result.htmlSource).toBe('<article># Kept markdown</article>');
  expect(vault.files.get('Note.md')).toBe('# Kept markdown');
  expect(vault.files.get(mapping.htmlPath)).toBe('<article># Kept markdown</article>');

  expect(updatedMapping.activeSource).toBe('markdown');
  expect(updatedMapping.conflictState.status).toBe('none');
  expect(updatedMapping.syncTimestamps.htmlSyncedAt).toBe('2026-06-06');
});
