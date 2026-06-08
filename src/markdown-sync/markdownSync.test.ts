import { RICH_DOCUMENTS_ROOT_PATH } from '../rich-documents/constants';
import { createRichDocumentMapping } from '../rich-documents/helpers';
import { ensureFirstMarkdownImport } from './markdownSync';
import {
  createMarkdownFile,
  createMarkdownRenderer,
  createMarkdownSyncStore,
  createVaultAdapter,
  createVaultReader,
} from '../markdownSyncTestHelpers';

test('writes first imported html and marks mapping as html active source', async () => {
  const mapping = createRichDocumentMapping('Import.md', 'rich-import', '2026-05-31', 'desktop');
  const richDocumentStore = createMarkdownSyncStore(mapping);
  const vault = createVaultAdapter();

  const result = await ensureFirstMarkdownImport({
    getCurrentTimestamp: () => '2026-05-31T12:00:00.000Z',
    mapping,
    markdownFile: createMarkdownFile('Import.md'),
    markdownRenderer: createMarkdownRenderer(
      '<div class="markdown-preview-section"><div class="el-h1"><h1>Imported</h1></div></div>'
    ),
    richDocumentStore,
    vaultAdapter: vault.adapter,
    vaultReader: createVaultReader('# Imported'),
  });

  expect(result.imported).toBe(true);

  expect(vault.files.get(`${RICH_DOCUMENTS_ROOT_PATH}/rich-import/document.html`)).toContain(
    '<h1>Imported</h1>'
  );

  expect(richDocumentStore.updateMapping).toHaveBeenCalledWith(
    'Import.md',
    expect.objectContaining({ activeSource: 'html' })
  );
});

test('uses injected Obsidian-rendered markdown import when available', async () => {
  const mapping = createRichDocumentMapping(
    'Rendered.md',
    'rich-rendered',
    '2026-05-31',
    'desktop'
  );

  const richDocumentStore = createMarkdownSyncStore(mapping);
  const vault = createVaultAdapter();

  const result = await ensureFirstMarkdownImport({
    mapping,
    markdownFile: createMarkdownFile('Rendered.md'),
    markdownRenderer: createMarkdownRenderer(
      '<div class="markdown-preview-section"><div class="el-h1"><h1>Rendered</h1></div></div>'
    ),
    richDocumentStore,
    vaultAdapter: vault.adapter,
    vaultReader: createVaultReader('# Source'),
  });

  expect(result.htmlSource).toContain('<h1>Rendered</h1>');
  expect(vault.files.get(`${RICH_DOCUMENTS_ROOT_PATH}/rich-rendered/document.html`)).toContain(
    '<h1>Rendered</h1>'
  );
});

test('sanitizes executable html during first markdown import', async () => {
  const mapping = createRichDocumentMapping('Unsafe.md', 'rich-unsafe', '2026-05-31', 'desktop');
  const richDocumentStore = createMarkdownSyncStore(mapping);
  const vault = createVaultAdapter();

  const result = await ensureFirstMarkdownImport({
    mapping,
    markdownFile: createMarkdownFile('Unsafe.md'),
    markdownRenderer: createMarkdownRenderer(
      [
        '<div class="markdown-preview-section">',
        '<p onclick="bad()">Body</p>',
        '<a href="javascript:bad()">Link</a>',
        '<script>bad()</script>',
        '</div>',
      ].join('')
    ),
    richDocumentStore,
    vaultAdapter: vault.adapter,
    vaultReader: createVaultReader('[Link](javascript:bad())'),
  });

  expect(result.htmlSource).toContain('<p>Body</p>');
  expect(result.htmlSource).not.toContain('onclick');
  expect(result.htmlSource).not.toContain('javascript:');

  expect(result.htmlSource).not.toContain('<script');
  expect(vault.files.get(mapping.htmlPath)).toBe(result.htmlSource);
});

test('sanitizes an existing richer html source before returning it', async () => {
  const mapping = createRichDocumentMapping(
    'Existing.md',
    'rich-existing',
    '2026-05-31',
    'desktop'
  );

  const richDocumentStore = createMarkdownSyncStore(mapping);
  const vault = createVaultAdapter(
    new Map([[mapping.htmlPath, '<article><img src="https://example.com/remote.png"></article>']])
  );

  const result = await ensureFirstMarkdownImport({
    mapping,
    markdownFile: createMarkdownFile('Existing.md'),
    richDocumentStore,
    vaultAdapter: vault.adapter,
    vaultReader: createVaultReader('# Replacement'),
  });

  expect(result.imported).toBe(false);
  expect(result.htmlSource).toContain('data-libre-remote-image-src');
  const htmlDocument = new DOMParser().parseFromString(result.htmlSource, 'text/html');

  expect(htmlDocument.querySelector('img')?.getAttribute('src')).toBe(null);
  expect(vault.files.get(mapping.htmlPath)).toBe(result.htmlSource);
});

test('uses protected raw markdown when no renderer is injected on first import', async () => {
  const mapping = createRichDocumentMapping('Raw.md', 'rich-raw', '2026-05-31', 'desktop');
  const richDocumentStore = createMarkdownSyncStore(mapping);
  const vault = createVaultAdapter();

  const result = await ensureFirstMarkdownImport({
    mapping,
    markdownFile: createMarkdownFile('Raw.md'),
    richDocumentStore,
    vaultAdapter: vault.adapter,
    vaultReader: createVaultReader('**Raw**'),
  });

  expect(result.imported).toBe(true);

  expect(result.htmlSource).toContain('data-libre-protected="raw-markdown"');

  expect(vault.files.get(`${RICH_DOCUMENTS_ROOT_PATH}/rich-raw/document.html`)).toContain(
    '**Raw**'
  );
});

test('does not rewrite an existing richer html source', async () => {
  const mapping = createRichDocumentMapping(
    'Existing.md',
    'rich-existing',
    '2026-05-31',
    'desktop'
  );

  const existingHtmlPath = `${RICH_DOCUMENTS_ROOT_PATH}/rich-existing/document.html`;
  const richDocumentStore = createMarkdownSyncStore(mapping);

  const vault = createVaultAdapter(new Map([[existingHtmlPath, '<article>Existing</article>']]));

  const result = await ensureFirstMarkdownImport({
    mapping,
    markdownFile: createMarkdownFile('Existing.md'),
    richDocumentStore,
    vaultAdapter: vault.adapter,
    vaultReader: createVaultReader('# Replacement'),
  });

  expect(result.imported).toBe(false);

  expect(result.htmlSource).toBe('<article>Existing</article>');

  expect(vault.adapter.write).not.toHaveBeenCalled();

  expect(richDocumentStore.updateMapping).not.toHaveBeenCalled();
});
