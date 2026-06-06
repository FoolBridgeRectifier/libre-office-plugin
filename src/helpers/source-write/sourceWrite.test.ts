import { createSourceStates } from '../../conflicts/helpers';
import { createRichDocumentMapping } from '../../rich-documents/helpers';
import { createStore, createVaultAdapter } from '../../markdown-sync/utils';
import { saveRichDocumentHtml, syncMarkdownMirror } from './sourceWrite';
import type { RichDocumentMapping } from '../../rich-documents/interfaces';

async function createOdtTrackedFixture(): Promise<{
  readonly mapping: RichDocumentMapping;
  readonly richDocumentStore: ReturnType<typeof createStore>;
  readonly vault: ReturnType<typeof createVaultAdapter>;
}> {
  const baseMapping = createRichDocumentMapping('Note.md', 'rich-note', '2026-06-04', 'desktop');

  const vault = createVaultAdapter(
    new Map([
      ['Note.md', 'Original markdown'],
      [baseMapping.htmlPath, '<article>Original</article>'],
      [baseMapping.odtPath, 'Original ODT'],
    ])
  );

  const mapping = {
    ...baseMapping,
    sourceStates: await createSourceStates(baseMapping, vault.adapter),
  };

  return { mapping, richDocumentStore: createStore(mapping), vault };
}

test('creates conflict when odt changes before html save', async () => {
  const { mapping, richDocumentStore, vault } = await createOdtTrackedFixture();

  vault.files.set(mapping.odtPath, 'External ODT');

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
    expect(updatedMapping.conflictState.changedSources).toEqual(['odt', 'html']);
  }

  expect(vault.files.get(mapping.odtPath)).toBe('External ODT');
});

test('does not overwrite markdown when odt changes before mirror sync', async () => {
  const { mapping, richDocumentStore, vault } = await createOdtTrackedFixture();

  vault.files.set(mapping.odtPath, 'External ODT');

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

test('sanitizes unsafe html before rich source writes and markdown sync', async () => {
  const { richDocumentStore, vault } = await createOdtTrackedFixture();

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
