import { LIBRE_MARKDOWN_VIEW_TYPE } from './editor-view/constants';

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

function createWorkspaceMock() {
  return {
    getActiveFile: jest.fn(() => null),
    getLeaf: jest.fn(() => ({ id: 'navigation-leaf' })),
    getLeavesOfType: jest.fn(() => []),
    getMostRecentLeaf: jest.fn(() => null),
    iterateAllLeaves: jest.fn(),
    on: jest.fn(() => ({ id: 'event-ref' })),
    onLayoutReady: jest.fn((callback: () => void) => callback()),
  };
}

function createVaultMock() {
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

test('registers the Libre markdown view and routing events on load', async () => {
  const { default: LibreNoteEditorPlugin } = await import('./main');
  const workspace = createWorkspaceMock();
  const vault = createVaultMock();

  const plugin = new LibreNoteEditorPlugin({ vault, workspace } as never, {} as never) as never as {
    addCommand: jest.Mock;
    onload(): Promise<void>;
    registerEvent: jest.Mock;
    registerView: jest.Mock;
  };

  await plugin.onload();

  expect(plugin.registerView).toHaveBeenCalledWith(LIBRE_MARKDOWN_VIEW_TYPE, expect.any(Function));

  expect(plugin.addCommand).toHaveBeenCalledTimes(1);
  expect(plugin.registerEvent).toHaveBeenCalledTimes(4);
});
