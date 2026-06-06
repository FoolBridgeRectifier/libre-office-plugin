import { createRichDocumentMapping } from './rich-documents/helpers';

export { createMetadataCacheMock } from './mainMetadataCacheTestHelpers';
export {
  createLeaf,
  createMarkdownFile,
  createPluginMockArguments,
  createVaultMock,
  createWorkspaceMock,
} from './mainWorkspaceTestHelpers';

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

export const mockOfficeRuntimeSetupState = {
  executablePath: 'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
  isBlocking: false,
  message: 'LibreOffice ready from configured path.',
  source: 'configured',
  status: 'ready',
  version: 'LibreOffice 24.8.0.0',
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
    Platform: {
      isLinux: false,
      isMacOS: false,
      isMobile: false,
      isWin: true,
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

jest.mock('./office-runtime/officeRuntime', () => ({
  detectOfficeRuntime: jest.fn(async () => mockOfficeRuntimeSetupState),
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
