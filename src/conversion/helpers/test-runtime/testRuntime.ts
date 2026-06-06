import { createSourceStates } from '../../../conflicts/helpers';
import { createRichDocumentMapping } from '../../../rich-documents/helpers';
import { ODT_MIME_TYPE, ODT_PACKAGE_SIGNATURE } from '../../constants';
import type { ConversionProcess } from '../../interfaces';
import type {
  RichDocumentMapping,
  RichDocumentStore,
  RichDocumentVaultAdapter,
} from '../../../rich-documents/interfaces';

export function createConversionTestVaultAdapter(
  files: Record<string, string>
): RichDocumentVaultAdapter {
  return {
    exists: jest.fn(async (path) => hasConversionTestFile(files, path)),
    list: jest.fn(async () => ({ files: [], folders: [] })),
    mkdir: jest.fn(),
    read: jest.fn(async (path) => files[path] ?? ''),
    rename: jest.fn(async (path, newPath) => {
      files[newPath] = files[path] ?? '';

      Reflect.deleteProperty(files, path);
    }),
    stat: jest.fn(async (path) => getConversionTestFileStat(files, path)),
    write: jest.fn(async (path, data) => {
      files[path] = data;
    }),
  };
}

export function createConversionTestStore(): RichDocumentStore {
  return {
    archiveMapping: jest.fn(),
    deleteMapping: jest.fn(),
    getMappingByMarkdownPath: jest.fn(),
    getMappingByRichDocumentId: jest.fn(),
    getOrCreateMapping: jest.fn(),
    loadMappings: jest.fn(),
    recoverMappings: jest.fn(),
    renameMapping: jest.fn(),
    updateMapping: jest.fn(async (_path, patch) => patch as RichDocumentMapping),
  };
}

export async function createConversionTestMapping(
  vaultAdapter: RichDocumentVaultAdapter,
  files: Record<string, string>
): Promise<RichDocumentMapping> {
  const mapping = createRichDocumentMapping('Note.md', 'rich-note', '2026-06-04', 'desktop');

  files[mapping.markdownPath] = '# Previous';
  files[mapping.htmlPath] = '<article><p>Previous</p></article>';
  files[mapping.odtPath] = createConversionTestOdtSource('before');

  return { ...mapping, sourceStates: await createSourceStates(mapping, vaultAdapter) };
}

export function createConversionTestOdtSource(label: string): string {
  return `${ODT_PACKAGE_SIGNATURE}-${ODT_MIME_TYPE}-${label}`;
}

export function createConversionTestProcess(
  onExecute?: () => void,
  result: Partial<Awaited<ReturnType<ConversionProcess['executeFile']>>> = {}
): ConversionProcess {
  return {
    executeFile: jest.fn(async () => {
      onExecute?.();

      const executionResult = {
        exitCode: result.exitCode === undefined ? 0 : result.exitCode,
        standardError: result.standardError ?? '',
        standardOutput: result.standardOutput ?? '',
      };

      return result.timedOut === undefined
        ? executionResult
        : { ...executionResult, timedOut: result.timedOut };
    }),
  };
}

function getConversionTestFileStat(files: Record<string, string>, path: string) {
  if (!hasConversionTestFile(files, path)) {
    return null;
  }

  const fileSource = files[path] ?? '';

  return { mtime: fileSource.length, size: fileSource.length };
}

function hasConversionTestFile(files: Record<string, string>, path: string): boolean {
  return Object.prototype.hasOwnProperty.call(files, path);
}
