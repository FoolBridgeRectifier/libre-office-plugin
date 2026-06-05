import { createRichDocumentStore } from './richDocuments';
import type { RichDocumentPluginData, RichDocumentVaultAdapter } from './interfaces';

export function createPersistenceTarget(pluginData: unknown = null) {
  let savedPluginData: RichDocumentPluginData | null = null;

  return {
    getSavedPluginData: () => savedPluginData,
    target: {
      loadData: jest.fn(async () => pluginData),
      saveData: jest.fn(async (data: RichDocumentPluginData) => {
        savedPluginData = data;
      }),
    },
  };
}

export function createVaultAdapter(initialFiles: ReadonlyMap<string, string> = new Map()) {
  const files = new Map(initialFiles);
  const folders = new Set<string>();
  const modifiedTimes = new Map<string, number>();

  const mkdirCalls: string[] = [];
  const renameCalls: Array<readonly [string, string]> = [];

  for (const filePath of files.keys()) {
    addFolderParents(folders, filePath);
    modifiedTimes.set(filePath, 1);
  }

  const adapter: RichDocumentVaultAdapter = {
    exists: jest.fn(
      async (normalizedPath: string) => files.has(normalizedPath) || folders.has(normalizedPath)
    ),
    list: jest.fn(async (normalizedPath: string) => ({
      files: getDirectChildren(files.keys(), normalizedPath),
      folders: getDirectChildren(folders.values(), normalizedPath),
    })),
    mkdir: jest.fn(async (normalizedPath: string) => {
      folders.add(normalizedPath);
      mkdirCalls.push(normalizedPath);
    }),
    read: jest.fn(async (normalizedPath: string) => files.get(normalizedPath) ?? ''),
    rename: jest.fn(async (normalizedPath: string, normalizedNewPath: string) => {
      const fileText = files.get(normalizedPath);

      files.delete(normalizedPath);
      files.set(normalizedNewPath, fileText ?? '');

      modifiedTimes.set(normalizedNewPath, modifiedTimes.get(normalizedPath) ?? 1);
      modifiedTimes.delete(normalizedPath);

      renameCalls.push([normalizedPath, normalizedNewPath]);
    }),
    stat: jest.fn(async (normalizedPath: string) => {
      const modifiedTime = modifiedTimes.get(normalizedPath);

      return modifiedTime === undefined ? null : { mtime: modifiedTime };
    }),
    write: jest.fn(async (normalizedPath: string, data: string) => {
      addFolderParents(folders, normalizedPath);
      files.set(normalizedPath, data);
      modifiedTimes.set(normalizedPath, (modifiedTimes.get(normalizedPath) ?? 1) + 1);
    }),
  };

  return { adapter, files, folders, mkdirCalls, modifiedTimes, renameCalls };
}

export function createStore(pluginData: unknown = null) {
  const persistence = createPersistenceTarget(pluginData);
  const vault = createVaultAdapter();

  const store = createRichDocumentStore({
    createRichDocumentId: () => 'rich-fixed-id',
    getCurrentTimestamp: () => '2026-05-31T12:00:00.000Z',
    lastEditorPlatform: 'desktop',
    persistenceTarget: persistence.target,
    vaultAdapter: vault.adapter,
  });

  return { persistence, store, vault };
}

function addFolderParents(folders: Set<string>, filePath: string): void {
  const pathParts = filePath.split('/').slice(0, -1);
  let folderPath = '';

  for (const pathPart of pathParts) {
    folderPath = folderPath ? `${folderPath}/${pathPart}` : pathPart;
    folders.add(folderPath);
  }
}

function getDirectChildren(pathValues: Iterable<string>, parentPath: string): string[] {
  return Array.from(pathValues).filter((pathValue) => getParentPath(pathValue) === parentPath);
}

function getParentPath(pathValue: string): string {
  return pathValue.split('/').slice(0, -1).join('/');
}
