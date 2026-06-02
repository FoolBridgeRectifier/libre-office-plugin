import { RICH_DOCUMENTS_ROOT_PATH } from '../rich-documents/constants';
import { createRichDocumentMapping } from '../rich-documents/helpers';
import { splitFrontmatter, convertMarkdownToHtml } from './helpers';
import { ensureFirstMarkdownImport } from './markdownSync';
import type { TFile } from 'obsidian';
import type {
  RichDocumentMapping,
  RichDocumentPluginData,
  RichDocumentStore,
  RichDocumentVaultAdapter,
} from '../rich-documents/interfaces';

function createMarkdownFile(path: string): TFile {
  return {
    basename: path.replace(/\.md$/i, ''),
    extension: 'md',
    name: path.split('/').pop() ?? path,
    path,
  } as TFile;
}

function createStore(mapping: RichDocumentMapping): RichDocumentStore {
  let currentMapping = mapping;

  return {
    archiveMapping: jest.fn(),
    deleteMapping: jest.fn(),
    getMappingByMarkdownPath: jest.fn(async () => currentMapping),
    getMappingByRichDocumentId: jest.fn(async () => currentMapping),
    getOrCreateMapping: jest.fn(async () => currentMapping),
    loadMappings: jest.fn(async () => [currentMapping]),
    recoverMappings: jest.fn(async () => [currentMapping]),
    renameMapping: jest.fn(),
    updateMapping: jest.fn(async (_markdownPath, patch) => {
      currentMapping = { ...currentMapping, ...patch };

      return currentMapping;
    }),
  };
}

function createVaultAdapter(initialFiles: ReadonlyMap<string, string> = new Map()) {
  const files = new Map(initialFiles);
  const folders = new Set<string>();

  const adapter: RichDocumentVaultAdapter = {
    exists: jest.fn(
      async (normalizedPath: string) => files.has(normalizedPath) || folders.has(normalizedPath)
    ),
    list: jest.fn(async () => ({ files: [], folders: [] })),
    mkdir: jest.fn(async (normalizedPath: string) => {
      folders.add(normalizedPath);
    }),
    read: jest.fn(async (normalizedPath: string) => files.get(normalizedPath) ?? ''),
    rename: jest.fn(),
    write: jest.fn(async (normalizedPath: string, data: string) => {
      files.set(normalizedPath, data);
    }),
  };

  return { adapter, files, folders };
}

function createHtmlContainer(htmlSource: string): HTMLDivElement {
  const htmlContainerElement = document.createElement('div');

  htmlContainerElement.innerHTML = htmlSource;

  return htmlContainerElement;
}

test('splits valid frontmatter without reordering keys', () => {
  const markdownSource = '---\ntitle: Alpha\ntags: [one, two]\n---\n# Body';

  expect(splitFrontmatter('No frontmatter').frontmatter).toBe(null);
  expect(splitFrontmatter(markdownSource).frontmatter).toBe('title: Alpha\ntags: [one, two]');
  expect(splitFrontmatter(markdownSource).bodyMarkdown).toBe('# Body');
});

test('leaves invalid or body-like frontmatter delimiters in markdown body', () => {
  const invalidFrontmatter = '---\ntitle Alpha\n---\nBody';
  const bodyBeginningWithDelimiter = '---\nThis is a horizontal-rule style opening';

  expect(splitFrontmatter(invalidFrontmatter).frontmatter).toBe(null);
  expect(splitFrontmatter(invalidFrontmatter).bodyMarkdown).toBe(invalidFrontmatter);

  expect(splitFrontmatter(bodyBeginningWithDelimiter).frontmatter).toBe(null);
  expect(splitFrontmatter(bodyBeginningWithDelimiter).bodyMarkdown).toBe(
    bodyBeginningWithDelimiter
  );
});

test('converts markdown through package-backed GFM and preserves Obsidian syntax', () => {
  const markdownSource = [
    '---',
    'title: Import Fixture',
    '---',
    '# Heading',
    '',
    'Paragraph with **bold**, *emphasis*, [link](https://example.com), [[Note|alias]], and ![[Image.png]].',
    '',
    '- [x] Done',
    '',
    '> [!NOTE]',
    '> Heads up',
    '',
    '```ts',
    '<script>alert("no")</script>',
    '```',
    '',
    '| A | B |',
    '| --- | --- |',
    '| 1 | 2 |',
  ].join('\n');

  const result = convertMarkdownToHtml(markdownSource);

  expect(result.frontmatter).toBe('title: Import Fixture');
  expect(result.htmlSource).toContain('<template data-libre-protected="frontmatter">');
  expect(result.htmlSource).toContain('<h1>Heading</h1>');

  expect(result.htmlSource).toContain('<strong>bold</strong>');
  expect(result.htmlSource).toContain('<em>emphasis</em>');

  expect(result.htmlSource).toContain('<a href="https://example.com">link</a>');

  expect(result.htmlSource).toContain('[[Note|alias]]');
  expect(result.htmlSource).toContain('![[Image.png]]');
  expect(result.htmlSource).toContain('class="contains-task-list"');
  expect(result.htmlSource).toContain('<blockquote>');

  expect(result.htmlSource).toContain('[!NOTE]');

  expect(result.htmlSource).toContain('&#x3C;script>alert("no")&#x3C;/script>');
  expect(result.htmlSource).toContain('<table>');
});

test('protects Obsidian-specific syntax outside code spans', () => {
  const markdownSource = [
    '[[Note|Alias]] ![[Image.png|320x200]] #tag/deep ^block-id',
    '`[[code]] ![[code.png]] #code/tag ^code-block`',
    '> [!warning]- Collapsed title',
  ].join('\n');

  const result = convertMarkdownToHtml(markdownSource);
  const htmlContainerElement = createHtmlContainer(result.htmlSource);

  expect(htmlContainerElement.querySelectorAll('[data-libre-protected^="obsidian-"]')).toHaveLength(
    5
  );

  expect(
    htmlContainerElement
      .querySelector('[data-libre-protected="obsidian-wiki-link"]')
      ?.getAttribute('data-obsidian-target')
  ).toBe('Note');

  expect(
    htmlContainerElement.querySelector('[data-libre-protected="obsidian-wiki-link"]')?.textContent
  ).toBe('Alias');

  expect(
    htmlContainerElement
      .querySelector('[data-libre-protected="obsidian-embed"]')
      ?.getAttribute('data-obsidian-target')
  ).toBe('Image.png');

  expect(
    htmlContainerElement
      .querySelector('[data-libre-protected="obsidian-tag"]')
      ?.getAttribute('data-obsidian-tag')
  ).toBe('tag/deep');

  expect(
    htmlContainerElement
      .querySelector('[data-libre-protected="obsidian-block-id"]')
      ?.getAttribute('data-obsidian-block-id')
  ).toBe('block-id');

  expect(
    htmlContainerElement
      .querySelector('[data-libre-protected="obsidian-callout"]')
      ?.getAttribute('data-obsidian-callout-fold')
  ).toBe('-');

  expect(htmlContainerElement.querySelector('code')?.textContent).toBe(
    '[[code]] ![[code.png]] #code/tag ^code-block'
  );
});

test('keeps safe raw html while sanitizing active html and unsafe links', () => {
  const markdownSource = [
    '<span style="color: #ff6600">orange</span>',
    '<img src=x onerror=alert(1)>',
    '<script>alert("no")</script>',
    '[bad](javascript:alert(1))',
  ].join('\n');

  const result = convertMarkdownToHtml(markdownSource);
  const htmlContainerElement = createHtmlContainer(result.htmlSource);

  expect(htmlContainerElement.querySelector('span')?.getAttribute('style')).toBe('color: #ff6600');
  expect(htmlContainerElement.querySelector('span')?.textContent).toBe('orange');
  expect(htmlContainerElement.querySelector('img')?.getAttribute('src')).toBe('x');

  expect(result.htmlSource).not.toContain('onerror');
  expect(result.htmlSource).not.toContain('<script');
  expect(result.htmlSource).not.toContain('href="javascript:alert');
});

test('renders GFM footnotes through the established markdown package', () => {
  const result = convertMarkdownToHtml('A note[^one].\n\n[^one]: footnote');

  expect(result.htmlSource).toContain('class="footnotes"');
  expect(result.htmlSource).toContain('footnote');
});

test('writes first imported html and marks mapping as html active source', async () => {
  const mapping = createRichDocumentMapping('Import.md', 'rich-import', '2026-05-31', 'desktop');
  const richDocumentStore = createStore(mapping);
  const vault = createVaultAdapter();

  const result = await ensureFirstMarkdownImport({
    getCurrentTimestamp: () => '2026-05-31T12:00:00.000Z',
    mapping,
    markdownFile: createMarkdownFile('Import.md'),
    richDocumentStore,
    vaultAdapter: vault.adapter,
    vaultReader: { read: jest.fn(async () => '# Imported') },
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

test('does not rewrite an existing richer html source', async () => {
  const mapping = createRichDocumentMapping(
    'Existing.md',
    'rich-existing',
    '2026-05-31',
    'desktop'
  );

  const existingHtmlPath = `${RICH_DOCUMENTS_ROOT_PATH}/rich-existing/document.html`;
  const richDocumentStore = createStore(mapping);

  const vault = createVaultAdapter(new Map([[existingHtmlPath, '<article>Existing</article>']]));

  const result = await ensureFirstMarkdownImport({
    mapping,
    markdownFile: createMarkdownFile('Existing.md'),
    richDocumentStore,
    vaultAdapter: vault.adapter,
    vaultReader: { read: jest.fn(async () => '# Replacement') },
  });

  expect(result.imported).toBe(false);
  expect(result.htmlSource).toBe('<article>Existing</article>');
  expect(vault.adapter.write).not.toHaveBeenCalled();
  expect(richDocumentStore.updateMapping).not.toHaveBeenCalled();
});

test('keeps plugin data type available for strict shared mappings', () => {
  const pluginData: RichDocumentPluginData = {
    mappings: [],
    version: 1,
  };

  expect(pluginData.version).toBe(1);
});
