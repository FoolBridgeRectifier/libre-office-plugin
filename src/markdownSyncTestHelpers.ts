import type { MarkdownBodyRenderer } from './markdown-sync/interfaces';
import type { RichDocumentMapping, RichDocumentStore } from './rich-documents/interfaces';

export { createMarkdownFile } from './testFileHelpers';
export { createVaultAdapter } from './rich-documents/utils';

export function createMarkdownRenderer(
  innerHtml: string
): jest.MockedFunction<MarkdownBodyRenderer> {
  return jest.fn(async (_bodyMarkdown, containerElement, _sourcePath) => {
    containerElement.innerHTML = innerHtml;
  });
}

export function createMarkdownSyncStore(mapping: RichDocumentMapping): RichDocumentStore {
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

export function createVaultReader(markdownSource: string) {
  return { read: jest.fn(async () => markdownSource) };
}
