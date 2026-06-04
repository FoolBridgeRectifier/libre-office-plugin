import { RICH_DOCUMENTS_ROOT_PATH } from '../rich-documents/constants';
import { createRichDocumentMapping } from '../rich-documents/helpers';
import { ensureFirstMarkdownImport } from './markdownSync';
import type { TFile } from 'obsidian';
import type {
  RichDocumentMapping,
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

test('writes first imported html and marks mapping as html active source', async () => {
  const mapping = createRichDocumentMapping('Import.md', 'rich-import', '2026-05-31', 'desktop');
  const richDocumentStore = createStore(mapping);
  const vault = createVaultAdapter();

  const result = await ensureFirstMarkdownImport({
    getCurrentTimestamp: () => '2026-05-31T12:00:00.000Z',
    mapping,
    markdownFile: createMarkdownFile('Import.md'),
    markdownRenderer: jest.fn(async (_bodyMarkdown, containerElement) => {
      containerElement.innerHTML =
        '<div class="markdown-preview-section"><div class="el-h1"><h1>Imported</h1></div></div>';
    }),
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

test('uses injected Obsidian-rendered markdown import when available', async () => {
  const mapping = createRichDocumentMapping(
    'Rendered.md',
    'rich-rendered',
    '2026-05-31',
    'desktop'
  );

  const richDocumentStore = createStore(mapping);
  const vault = createVaultAdapter();

  const result = await ensureFirstMarkdownImport({
    mapping,
    markdownFile: createMarkdownFile('Rendered.md'),
    markdownRenderer: jest.fn(async (_bodyMarkdown, containerElement) => {
      containerElement.innerHTML =
        '<div class="markdown-preview-section"><div class="el-h1"><h1>Rendered</h1></div></div>';
    }),
    richDocumentStore,
    vaultAdapter: vault.adapter,
    vaultReader: { read: jest.fn(async () => '# Source') },
  });

  expect(result.htmlSource).toContain('<h1>Rendered</h1>');
  expect(vault.files.get(`${RICH_DOCUMENTS_ROOT_PATH}/rich-rendered/document.html`)).toContain(
    '<h1>Rendered</h1>'
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
