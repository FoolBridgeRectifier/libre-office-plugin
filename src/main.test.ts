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
      registerEvent = jest.fn();
      registerView = jest.fn();

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

test('registers the Libre markdown view and routing events on load', async () => {
  const { default: LibreNoteEditorPlugin } = await import('./main');
  const workspace = createWorkspaceMock();

  const plugin = new LibreNoteEditorPlugin({ workspace } as never, {} as never) as never as {
    addCommand: jest.Mock;
    onload(): void;
    registerEvent: jest.Mock;
    registerView: jest.Mock;
  };

  plugin.onload();

  expect(plugin.registerView).toHaveBeenCalledWith(LIBRE_MARKDOWN_VIEW_TYPE, expect.any(Function));

  expect(plugin.addCommand).toHaveBeenCalledTimes(1);
  expect(plugin.registerEvent).toHaveBeenCalledTimes(2);
});
