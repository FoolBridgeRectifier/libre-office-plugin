import type { TFile } from 'obsidian';

import type { MarkdownBodyRenderer } from './interfaces';
import type {
  RichDocumentMapping,
  RichDocumentStore,
  RichDocumentVaultAdapter,
} from '../rich-documents/interfaces';

export function createMarkdownFile(path: string): TFile {
  return {
    basename: path.replace(/\.md$/i, ''),
    extension: 'md',
    name: path.replace(/^.*\//, ''),
    path,
  } as TFile;
}

export function createStore(mapping: RichDocumentMapping): RichDocumentStore {
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

export function createMarkdownRenderer(
  innerHtml: string
): jest.MockedFunction<MarkdownBodyRenderer> {
  return jest.fn(async (_bodyMarkdown, containerElement, _sourcePath) => {
    containerElement.innerHTML = innerHtml;
  });
}

export function createVaultReader(markdownSource: string) {
  return { read: jest.fn(async () => markdownSource) };
}

export function createVaultAdapter(initialFiles: ReadonlyMap<string, string> = new Map()) {
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
