import '@testing-library/jest-dom';

jest.mock(
  'obsidian',
  () => ({
    Component: class MockComponent {
      load = jest.fn();
      unload = jest.fn();
    },
    FileView: class MockFileView {
      allowNoFile = false;
      contentEl = { empty: jest.fn() };
      navigation = false;

      constructor(leaf: unknown) {
        void leaf;
      }
    },
    MarkdownRenderer: {
      render: jest.fn(async () => undefined),
      renderMarkdown: jest.fn(async () => undefined),
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

jest.mock('@fluentui/react-icons', () => {
  function createMockFluentIcon() {
    return function MockFluentIcon() {
      return null;
    };
  }

  return {
    ClipboardPaste24Regular: createMockFluentIcon(),
    Eye24Regular: createMockFluentIcon(),
    Image24Regular: createMockFluentIcon(),
    Link24Regular: createMockFluentIcon(),
    PaintBrush24Regular: createMockFluentIcon(),
    Table24Regular: createMockFluentIcon(),
    TextBold24Regular: createMockFluentIcon(),
    TextItalic24Regular: createMockFluentIcon(),
  };
});
