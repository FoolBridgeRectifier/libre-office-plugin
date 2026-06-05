import { createRichDocumentMapping } from '../rich-documents/helpers';
import {
  createMarkdownFile,
  createMarkdownRenderer,
  createStore,
  createVaultAdapter,
  createVaultReader,
} from './utils';

test('creates markdown file mocks with path-derived names', () => {
  const markdownFile = createMarkdownFile('Folder/Note.md');

  expect(markdownFile.basename).toBe('Folder/Note');
  expect(markdownFile.extension).toBe('md');
  expect(markdownFile.name).toBe('Note.md');
  expect(markdownFile.path).toBe('Folder/Note.md');
});

test('creates renderer and reader mocks for markdown import tests', async () => {
  const containerElement = document.createElement('div');
  const renderer = createMarkdownRenderer('<p>Rendered</p>');
  const vaultReader = createVaultReader('# Source');

  await renderer('# Source', containerElement, 'Source.md');

  expect(containerElement.innerHTML).toBe('<p>Rendered</p>');
  expect(await vaultReader.read()).toBe('# Source');
});

test('tracks current mapping state in markdown import store mocks', async () => {
  const mapping = createRichDocumentMapping('Note.md', 'rich-note', '2026-05-31', 'desktop');
  const store = createStore(mapping);

  await expect(store.getMappingByMarkdownPath('Note.md')).resolves.toBe(mapping);
  await expect(store.getMappingByRichDocumentId('rich-note')).resolves.toBe(mapping);
  await expect(store.getOrCreateMapping('Note.md')).resolves.toBe(mapping);

  await expect(store.loadMappings()).resolves.toEqual([mapping]);
  await expect(store.recoverMappings()).resolves.toEqual([mapping]);

  const updatedMapping = await store.updateMapping('Note.md', { activeSource: 'html' });

  expect(updatedMapping.activeSource).toBe('html');
  await expect(store.getMappingByMarkdownPath('Note.md')).resolves.toBe(updatedMapping);
});

test('tracks files and folders in markdown import vault adapter mocks', async () => {
  const vault = createVaultAdapter(new Map([['Existing.md', 'Existing']]));

  await expect(vault.adapter.exists('Existing.md')).resolves.toBe(true);
  await expect(vault.adapter.exists('Folder')).resolves.toBe(false);
  await expect(vault.adapter.read('Missing.md')).resolves.toBe('');

  await vault.adapter.mkdir('Folder');
  await vault.adapter.write('Folder/Written.md', 'Written');

  expect(vault.folders.has('Folder')).toBe(true);
  expect(vault.files.get('Folder/Written.md')).toBe('Written');

  await expect(vault.adapter.exists('Folder')).resolves.toBe(true);
  await expect(vault.adapter.read('Existing.md')).resolves.toBe('Existing');
  await expect(vault.adapter.list('Folder')).resolves.toEqual({ files: [], folders: [] });
});
