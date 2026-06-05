import type { TFile, WorkspaceLeaf } from 'obsidian';

import { EditorView } from './EditorView';
import type { EditorViewOptions } from './interfaces';

const mockReactRoot = {
  render: jest.fn(),
  unmount: jest.fn(),
};

jest.mock(
  'obsidian',
  () => ({
    FileView: class MockFileView {
      allowNoFile = false;
      contentEl = document.createElement('div') as HTMLDivElement & { empty: jest.Mock };
      navigation = false;

      constructor(workspaceLeaf: unknown) {
        void workspaceLeaf;
        this.contentEl.empty = jest.fn();
      }
    },
  }),
  { virtual: true }
);

jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => mockReactRoot),
}));

jest.mock('../App', () => ({
  App: jest.fn(() => null),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

function createMarkdownFile(path: string): TFile {
  return {
    basename: path.replace(/\.md$/i, ''),
    extension: 'md',
    name: path.replace(/^.*\//, ''),
    path,
  } as TFile;
}

function createEditorViewOptions(): EditorViewOptions {
  return {
    getLinkWarnings: jest.fn(() => []),
    loadImportedHtmlSource: jest.fn(async (file: TFile) => `<article>${file.path}</article>`),
    saveHtmlSource: jest.fn(async () => undefined),
    syncMarkdownMirror: jest.fn(async () => undefined),
  };
}

function getLastAppProps() {
  return mockReactRoot.render.mock.lastCall?.[0].props as {
    onHtmlSourceChange(htmlSource: string): void;
  };
}

test('flushes pending edits when the view closes', async () => {
  const options = createEditorViewOptions();
  const editorView = new EditorView({} as WorkspaceLeaf, options);

  await (editorView as EditorView & { onOpen(): Promise<void> }).onOpen();
  await editorView.onLoadFile(createMarkdownFile('Close.md'));
  getLastAppProps().onHtmlSourceChange('<article>Changed</article>');
  await (editorView as EditorView & { onClose(): Promise<void> }).onClose();

  expect(options.saveHtmlSource).toHaveBeenCalledWith(
    'Close.md',
    '<article>Changed</article>',
    '<article>Close.md</article>'
  );

  expect(options.syncMarkdownMirror).toHaveBeenCalledWith('Close.md', '<article>Changed</article>');
});

test('flushes the previous note before switching files', async () => {
  const options = createEditorViewOptions();
  const editorView = new EditorView({} as WorkspaceLeaf, options);

  await (editorView as EditorView & { onOpen(): Promise<void> }).onOpen();
  await editorView.onLoadFile(createMarkdownFile('First.md'));
  getLastAppProps().onHtmlSourceChange('<article>First changed</article>');
  await editorView.onLoadFile(createMarkdownFile('Second.md'));

  expect(options.saveHtmlSource).toHaveBeenCalledWith(
    'First.md',
    '<article>First changed</article>',
    '<article>First.md</article>'
  );

  expect(options.syncMarkdownMirror).toHaveBeenCalledWith(
    'First.md',
    '<article>First changed</article>'
  );
});
