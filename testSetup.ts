import '@testing-library/jest-dom';
import { createElement as mockCreateElement } from 'react';
import { TextDecoder, TextEncoder } from 'util';

if (typeof globalThis.TextEncoder === 'undefined') {
  Object.defineProperty(globalThis, 'TextEncoder', { value: TextEncoder });
}

if (typeof globalThis.TextDecoder === 'undefined') {
  Object.defineProperty(globalThis, 'TextDecoder', { value: TextDecoder });
}

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

      async setState(_state: unknown, _result: unknown): Promise<void> {
        return undefined;
      }
    },
    MarkdownRenderer: {
      render: jest.fn(async () => undefined),
      renderMarkdown: jest.fn(async () => undefined),
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

jest.mock('@fluentui/react-icons', () => {
  function createMockFluentIcon(shouldRenderSvg = false) {
    return function MockFluentIcon(props: {
      readonly 'aria-hidden'?: boolean;
      readonly className?: string;
    }) {
      return shouldRenderSvg ? mockCreateElement('svg', props) : null;
    };
  }

  return {
    CaretDown16Filled: createMockFluentIcon(true),
    CaretDown16Regular: createMockFluentIcon(true),
    CaretRight16Filled: createMockFluentIcon(true),
    CaretRight16Regular: createMockFluentIcon(true),
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
