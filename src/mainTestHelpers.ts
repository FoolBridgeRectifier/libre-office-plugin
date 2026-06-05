import { NATIVE_MARKDOWN_VIEW_TYPE } from './editor-view/constants';
import { createMetadataCacheMock } from './mainMetadataCacheTestHelpers';
import { createRichDocumentMapping } from './rich-documents/helpers';
import type { TFile, WorkspaceLeaf } from 'obsidian';

export { createMetadataCacheMock } from './mainMetadataCacheTestHelpers';

export const mockMapping = createRichDocumentMapping(
  'Note.md',
  'rich-note',
  '2026-06-04',
  'desktop'
);

export const mockRichDocumentStore = {
  archiveMapping: jest.fn(),
  deleteMapping: jest.fn(),
  getMappingByMarkdownPath: jest.fn(),
  getMappingByRichDocumentId: jest.fn(),
  getOrCreateMapping: jest.fn(async () => mockMapping),
  loadMappings: jest.fn(async () => []),
  recoverMappings: jest.fn(),
  renameMapping: jest.fn(),
  updateMapping: jest.fn(),
};

jest.mock(
  'obsidian',
  () => ({
    FileView: class MockFileView {
      allowNoFile = false;
      contentEl = { empty: jest.fn() };
      navigation = false;

      constructor(leaf: unknown) {
        void leaf;
      }
    },
    Plugin: class MockPlugin {
      addCommand = jest.fn();
      app: unknown;
      loadData = jest.fn(async () => null);
      registerEvent = jest.fn();
      registerView = jest.fn();
      saveData = jest.fn();

      constructor(app: unknown) {
        this.app = app;
      }
    },
  }),
  { virtual: true }
);

jest.mock('../styles.css', () => ({}));

jest.mock('./rich-documents/richDocuments', () => ({
  createRichDocumentStore: jest.fn(() => mockRichDocumentStore),
}));

jest.mock('./markdown-sync/markdownSync', () => ({
  ensureFirstMarkdownImport: jest.fn(async () => ({
    frontmatter: null,
    htmlSource: '<article>Imported</article>',
    imported: true,
  })),
}));

jest.mock('./markdown-sync/helpers', () => ({
  renderMarkdownWithObsidian: jest.fn(async () => undefined),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockRichDocumentStore.getOrCreateMapping.mockResolvedValue(mockMapping);
  mockRichDocumentStore.loadMappings.mockResolvedValue([]);
});

export function createMarkdownFile(path: string): TFile {
  return {
    basename: path.replace(/\.md$/i, ''),
    extension: 'md',
    name: path.split('/').pop() ?? path,
    path,
  } as TFile;
}

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
      list: jest.fn(async () => ({ files: [], folders: [] })),
      mkdir: jest.fn(),
      read: jest.fn(),
      rename: jest.fn(),
      write: jest.fn(),
    },
    on: jest.fn(() => ({ id: 'vault-event-ref' })),
  };
}
