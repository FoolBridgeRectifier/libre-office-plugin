import { createSourceStates } from '../conflicts';
import { createRichDocumentMapping } from '../rich-documents';
import { createMarkdownSyncStore, createVaultAdapter } from '../markdownSyncTestHelpers';
import { saveRichDocumentHtml, syncMarkdownMirror } from './sourceWrite';
import type { RichDocumentMapping } from '../rich-documents/interfaces';

async function createHtmlTrackedFixture(): Promise<{
  readonly mapping: RichDocumentMapping;
  readonly richDocumentStore: ReturnType<typeof createMarkdownSyncStore>;
  readonly vault: ReturnType<typeof createVaultAdapter>;
}> {
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

  return { mapping, richDocumentStore: createMarkdownSyncStore(mapping), vault };
}

test('creates conflict when html changes before html save', async () => {
  const { mapping, richDocumentStore, vault } = await createHtmlTrackedFixture();

  vault.files.set(mapping.htmlPath, '<article>External HTML</article>');

  await expect(
    saveRichDocumentHtml({
      htmlSource: '<article>Current edit</article>',
      markdownPath: 'Note.md',
      previousHtmlSource: '<article>Original</article>',
      richDocumentStore,
      vaultAdapter: vault.adapter,
    })
  ).rejects.toThrow('Libre Note Editor conflict detected.');

  const updatedMapping = await richDocumentStore.getOrCreateMapping('Note.md');

  expect(updatedMapping.conflictState.status).toBe('conflicted');

  if (updatedMapping.conflictState.status === 'conflicted') {
    expect(updatedMapping.conflictState.changedSources).toEqual(['html']);
  }

  expect(vault.files.get(mapping.htmlPath)).toBe('<article>External HTML</article>');
});

test('does not overwrite markdown when html changes before mirror sync', async () => {
  const { mapping, richDocumentStore, vault } = await createHtmlTrackedFixture();

  vault.files.set(mapping.htmlPath, '<article>External HTML</article>');

  await expect(
    syncMarkdownMirror({
      htmlSource: '<article><p>Local HTML</p></article>',
      markdownPath: 'Note.md',
      richDocumentStore,
      vaultAdapter: vault.adapter,
    })
  ).rejects.toThrow('Libre Note Editor conflict detected.');

  const updatedMapping = await richDocumentStore.getOrCreateMapping('Note.md');

  expect(vault.files.get('Note.md')).toBe('Original markdown');
  expect(updatedMapping.conflictState.status).toBe('conflicted');
});

test('does not overwrite externally changed markdown task state during mirror sync', async () => {
  const { mapping, richDocumentStore, vault } = await createHtmlTrackedFixture();

  vault.files.set('Note.md', '- [x] External task state');

  await expect(
    syncMarkdownMirror({
      htmlSource:
        '<article><ul><li class="task-list-item" data-task=" "><input class="task-list-item-checkbox" type="checkbox">Local task state</li></ul></article>',
      markdownPath: 'Note.md',
      richDocumentStore,
      vaultAdapter: vault.adapter,
    })
  ).rejects.toThrow('Libre Note Editor conflict detected.');

  const updatedMapping = await richDocumentStore.getOrCreateMapping('Note.md');

  expect(vault.files.get(mapping.markdownPath)).toBe('- [x] External task state');
  expect(updatedMapping.conflictState.status).toBe('conflicted');
});

test('skips source writes after a markdown note has been archived and deleted', async () => {
  const { mapping, richDocumentStore, vault } = await createHtmlTrackedFixture();

  const archivedMapping = {
    ...mapping,
    archivedAt: '2026-06-08T20:00:00.000Z',
    lifecycleState: 'archived' as const,
  };

  vault.files.delete('Note.md');
  await richDocumentStore.updateMapping('Note.md', archivedMapping);

  await saveRichDocumentHtml({
    htmlSource: '<article><p>Ignored</p></article>',
    markdownPath: 'Note.md',
    previousHtmlSource: '<article>Original</article>',
    richDocumentStore,
    vaultAdapter: vault.adapter,
  });

  await syncMarkdownMirror({
    htmlSource: '<article><p>Ignored</p></article>',
    markdownPath: 'Note.md',
    richDocumentStore,
    vaultAdapter: vault.adapter,
  });

  const updatedMapping = await richDocumentStore.getOrCreateMapping('Note.md');

  expect(vault.files.has('Note.md')).toBe(false);
  expect(vault.files.get(mapping.htmlPath)).toBe('<article>Original</article>');
  expect(updatedMapping.conflictState.status).toBe('none');
});

test('sanitizes unsafe html before rich source writes and markdown sync', async () => {
  const { richDocumentStore, vault } = await createHtmlTrackedFixture();

  await saveRichDocumentHtml({
    htmlSource: '<article><p onclick="bad()">Clean body</p><script>bad()</script></article>',
    markdownPath: 'Note.md',
    previousHtmlSource: '<article>Original</article>',
    richDocumentStore,
    vaultAdapter: vault.adapter,
  });

  await syncMarkdownMirror({
    htmlSource: vault.files.get('.libre-note-editor/documents/rich-note/document.html') ?? '',
    markdownPath: 'Note.md',
    richDocumentStore,
    vaultAdapter: vault.adapter,
  });

  expect(vault.files.get('.libre-note-editor/documents/rich-note/document.html')).toBe(
    '<article><p>Clean body</p></article>'
  );

  expect(vault.files.get('Note.md')).toBe('Clean body');
});
