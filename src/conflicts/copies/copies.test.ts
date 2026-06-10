import { createConflictCopyPath, createConflictState } from './copies';
import { createRichDocumentMapping } from '../../rich-documents';
import { createVaultAdapter } from '../../rich-documents/utils';

test('creates stable timestamped conflict copy paths', () => {
  const mapping = createRichDocumentMapping('Note.md', 'rich-note', '2026-06-04', 'desktop');

  expect(
    createConflictCopyPath(mapping, mapping.markdownPath, 'markdown', '2026-06-05T12:34:56.789Z')
  ).toBe('.libre-note-editor/documents/rich-note/conflicts/20260605123456789-markdown.md');
});

test('creates conflict copies without deleting source files', async () => {
  const mapping = createRichDocumentMapping('Note.md', 'rich-note', '2026-06-04', 'desktop');

  const vault = createVaultAdapter(
    new Map([
      ['Note.md', 'Markdown'],
      [mapping.htmlPath, '<article>HTML</article>'],
    ])
  );

  const conflictState = await createConflictState({
    changedSources: ['markdown', 'html'],
    currentHtmlSource: '<article>Current HTML</article>',
    detectedAt: '2026-06-05T12:34:56.789Z',
    mapping,
    reason: 'multi-source-change',
    vaultAdapter: vault.adapter,
  });

  const conflictCopySources = conflictState.conflictCopies.map(
    (conflictCopy) => conflictCopy.source
  );

  expect(conflictState.conflictCopies).toHaveLength(2);
  expect(conflictCopySources).toEqual(['html', 'markdown']);

  expect(vault.files.get('Note.md')).toBe('Markdown');
  expect(vault.files.get(mapping.htmlPath)).toBe('<article>HTML</article>');
});
