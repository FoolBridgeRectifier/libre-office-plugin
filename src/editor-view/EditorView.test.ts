import { createRoot } from 'react-dom/client';

import { App } from '../App';
import { LIBRE_MARKDOWN_VIEW_TYPE } from './constants';
import { EditorView } from './EditorView';
import type { EditorViewOptions } from './interfaces';
import type { TFile, ViewStateResult, WorkspaceLeaf } from 'obsidian';

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
        this.contentEl.empty = jest.fn(() => {
          this.contentEl.innerHTML = '';
        });
      }

      async setState(): Promise<void> {
        return undefined;
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
    name: path.split('/').pop() ?? path,
    path,
  } as TFile;
}

function createEditorView(
  loadImportedHtmlSource = jest.fn(async () => '<article>Loaded</article>')
) {
  const options: EditorViewOptions = { loadImportedHtmlSource };

  return new EditorView({} as WorkspaceLeaf, options);
}

test('exposes Obsidian FileView metadata for markdown panes', () => {
  const editorView = createEditorView();

  expect(editorView.allowNoFile).toBe(true);
  expect(editorView.navigation).toBe(true);
  expect(editorView.canAcceptExtension('MD')).toBe(true);
  expect(editorView.canAcceptExtension('png')).toBe(false);

  expect(editorView.getDisplayText()).toBe('Libre Note Editor');
  expect(editorView.getState()).toEqual({ file: null });
  expect(editorView.getViewType()).toBe(LIBRE_MARKDOWN_VIEW_TYPE);
});

test('renders imported html for loaded markdown files', async () => {
  const markdownFile = createMarkdownFile('Folder/Loaded.md');
  const loadImportedHtmlSource = jest.fn(async () => '<article>Loaded</article>');
  const editorView = createEditorView(loadImportedHtmlSource);

  await editorView.onLoadFile(markdownFile);

  expect(loadImportedHtmlSource).toHaveBeenCalledWith(markdownFile);
  expect(editorView.getDisplayText()).toBe('Folder/Loaded');
  expect(editorView.getState()).toEqual({ file: 'Folder/Loaded.md' });
});

test('opens and closes the React root inside the Obsidian content element', async () => {
  const editorView = createEditorView();

  await (editorView as EditorView & { onOpen(): Promise<void> }).onOpen();
  await editorView.onLoadFile(createMarkdownFile('Open.md'));

  expect(createRoot).toHaveBeenCalledWith(editorView.contentEl);

  expect(mockReactRoot.render).toHaveBeenLastCalledWith(
    expect.objectContaining({
      props: { activeFilePath: 'Open.md', importedHtmlSource: '<article>Loaded</article>' },
      type: App,
    })
  );

  await (editorView as EditorView & { onClose(): Promise<void> }).onClose();

  expect(mockReactRoot.unmount).toHaveBeenCalledTimes(1);
  expect(editorView.contentEl.empty).toHaveBeenCalledTimes(2);
});

test('ignores unsupported files and clears state on unload', async () => {
  const loadImportedHtmlSource = jest.fn();
  const editorView = createEditorView(loadImportedHtmlSource);
  const textFile = { ...createMarkdownFile('Unsupported.txt'), extension: 'txt' } as TFile;

  await (editorView as EditorView & { onOpen(): Promise<void> }).onOpen();
  await editorView.onLoadFile(textFile);

  expect(loadImportedHtmlSource).not.toHaveBeenCalled();
  expect(mockReactRoot.render).toHaveBeenLastCalledWith(
    expect.objectContaining({ props: { activeFilePath: null, importedHtmlSource: null } })
  );

  await editorView.onUnloadFile(textFile);

  expect(editorView.getState()).toEqual({ file: null });
});

test('rerenders after Obsidian restores view state', async () => {
  const editorView = createEditorView();

  await (editorView as EditorView & { onOpen(): Promise<void> }).onOpen();
  await editorView.setState({ file: 'Restored.md' }, {} as ViewStateResult);

  expect(mockReactRoot.render).toHaveBeenCalledTimes(2);
});

test('reloads html only for the active renamed markdown file', async () => {
  const loadImportedHtmlSource = jest.fn(async () => '<article>Loaded</article>');
  const editorView = createEditorView(loadImportedHtmlSource);

  await editorView.onLoadFile(createMarkdownFile('Same.md'));
  await editorView.onRename(createMarkdownFile('Other.md'));
  await editorView.onRename(createMarkdownFile('Same.md'));

  expect(loadImportedHtmlSource).toHaveBeenCalledTimes(2);
});
