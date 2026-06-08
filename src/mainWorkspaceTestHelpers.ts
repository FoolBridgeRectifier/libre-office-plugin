import { NATIVE_MARKDOWN_VIEW_TYPE } from './editor-view/constants';
import { createMetadataCacheMock } from './mainMetadataCacheTestHelpers';
import type { TFile, WorkspaceLeaf } from 'obsidian';

export { createMarkdownFile } from './testFileHelpers';

export function createLeaf(
  file: TFile | null,
  viewType = NATIVE_MARKDOWN_VIEW_TYPE
): WorkspaceLeaf {
  const workspaceLeaf = {} as WorkspaceLeaf;

  workspaceLeaf.detach = jest.fn();
  workspaceLeaf.openFile = jest.fn();
  workspaceLeaf.setViewState = jest.fn(async () => undefined);

  workspaceLeaf.view = Object.assign({} as WorkspaceLeaf['view'], {
    file,
    getViewType: () => viewType,
  });

  return workspaceLeaf;
}

export function createPluginMockArguments(
  vault: ReturnType<typeof createVaultMock>,
  workspace: ReturnType<typeof createWorkspaceMock>,
  metadataCache = createMetadataCacheMock()
) {
  return [{ metadataCache, vault, workspace } as never, {} as never] as const;
}

export function createWorkspaceMock() {
  const eventHandlers = new Map<string, (...eventArguments: unknown[]) => void>();

  return {
    eventHandlers,
    getActiveFile: jest.fn((): TFile | null => null),
    getLeaf: jest.fn((): WorkspaceLeaf => createLeaf(null)),
    getLeavesOfType: jest.fn((): WorkspaceLeaf[] => []),
    getMostRecentLeaf: jest.fn((): WorkspaceLeaf | null => null),
    iterateAllLeaves: jest.fn(),
    on: jest.fn((eventName: string, callback: (...eventArguments: unknown[]) => void) => {
      eventHandlers.set(eventName, callback);

      return { id: 'event-ref' };
    }),
    onLayoutReady: jest.fn((callback: () => void) => callback()),
  };
}

export function createVaultMock() {
  return {
    adapter: {
      exists: jest.fn(async () => false),
      getFullPath: jest.fn((normalizedPath: string) => `C:\\Vault\\${normalizedPath}`),
      list: jest.fn(async () => ({ files: [], folders: [] })),
      mkdir: jest.fn(),
      read: jest.fn(),
      rename: jest.fn(),
      write: jest.fn(),
    },
    on: jest.fn(() => ({ id: 'vault-event-ref' })),
  };
}
