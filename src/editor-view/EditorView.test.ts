import { createRoot } from 'react-dom/client';

import { App } from '../App';
import { LIBRE_MARKDOWN_VIEW_TYPE, LIBRE_NOTE_EDITOR_CONTENT_CLASS_NAME } from './constants';
import { EditorView } from './EditorView';
import { createFile } from './utils';
import type { EditorViewOptions } from './interfaces';
import type { ViewStateResult, WorkspaceLeaf } from 'obsidian';

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

function createEditorView(
  loadImportedHtmlSource = jest.fn(async () => '<article>Loaded</article>'),
  getLinkWarnings: EditorViewOptions['getLinkWarnings'] = jest.fn(() => []),
  getInitialAutosaveStatus?: EditorViewOptions['getInitialAutosaveStatus'],
  resolveConflict: EditorViewOptions['resolveConflict'] = jest.fn(
    async () => '<article>Resolved</article>'
  ),
  extraOptions: Partial<EditorViewOptions> = {}
) {
  const options: EditorViewOptions = {
    getLinkWarnings,
    loadImportedHtmlSource,
    resolveConflict,
    saveHtmlSource: jest.fn(),
    syncMarkdownMirror: jest.fn(),
    ...extraOptions,
  };

  if (getInitialAutosaveStatus) {
    options.getInitialAutosaveStatus = getInitialAutosaveStatus;
  }

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

test('does not wait for desktop source refresh before rendering imported html', async () => {
  const syncDesktopSource = jest.fn(() => new Promise<string | null>(() => undefined));

  const editorView = createEditorView(
    jest.fn(async () => '<article>Immediate</article>'),
    jest.fn(() => []),
    undefined,
    undefined,
    { syncDesktopSource }
  );

  await (editorView as EditorView & { onOpen(): Promise<void> }).onOpen();
  await editorView.onLoadFile(createFile('Immediate.md', 'md'));

  expect(syncDesktopSource).toHaveBeenCalledWith(createFile('Immediate.md', 'md'));

  expect(mockReactRoot.render).toHaveBeenLastCalledWith(
    expect.objectContaining({
      props: expect.objectContaining({
        activeFilePath: 'Immediate.md',
        desktopSourceStatus: 'loading',
        importedHtmlSource: '<article>Immediate</article>',
      }),
    })
  );
});

test('renders imported html for loaded markdown files', async () => {
  const markdownFile = createFile('Folder/Loaded.md', 'md');
  const loadImportedHtmlSource = jest.fn(async () => '<article>Loaded</article>');
  const editorView = createEditorView(loadImportedHtmlSource);

  await editorView.onLoadFile(markdownFile);

  expect(loadImportedHtmlSource).toHaveBeenCalledWith(markdownFile);
  expect(editorView.getDisplayText()).toBe('Folder/Loaded');
  expect(editorView.getState()).toEqual({ file: 'Folder/Loaded.md' });
});

test('renders a loading state before async html import finishes', async () => {
  const markdownFile = createFile('Slow.md', 'md');
  let finishLoad: (htmlSource: string) => void = () => undefined;

  const loadImportedHtmlSource = jest.fn(
    () =>
      new Promise<string>((resolve) => {
        finishLoad = resolve;
      })
  );

  const editorView = createEditorView(loadImportedHtmlSource);

  await (editorView as EditorView & { onOpen(): Promise<void> }).onOpen();
  const loadPromise = editorView.onLoadFile(markdownFile);

  expect(mockReactRoot.render).toHaveBeenLastCalledWith(
    expect.objectContaining({
      props: expect.objectContaining({
        activeFilePath: 'Slow.md',
        importedHtmlSource: null,
      }),
    })
  );

  while (loadImportedHtmlSource.mock.calls.length === 0) {
    await Promise.resolve();
  }

  finishLoad('<article>Slow loaded</article>');
  await loadPromise;

  expect(mockReactRoot.render).toHaveBeenLastCalledWith(
    expect.objectContaining({
      props: expect.objectContaining({
        importedHtmlSource: '<article>Slow loaded</article>',
      }),
    })
  );
});

test('passes unresolved link warning count to the React app', async () => {
  const unresolvedHeadingWarning = {
    linkText: '[[Note#Old Heading]]',
    targetNote: 'Note',
    targetValue: 'Old Heading',
    type: 'missing-heading-target' as const,
  };

  const getLinkWarnings = jest.fn(() => [unresolvedHeadingWarning]);
  const editorView = createEditorView(undefined, getLinkWarnings);

  await (editorView as EditorView & { onOpen(): Promise<void> }).onOpen();
  await editorView.onLoadFile(createFile('Warnings.md', 'md'));

  expect(mockReactRoot.render).toHaveBeenLastCalledWith(
    expect.objectContaining({
      props: expect.objectContaining({ linkWarningCount: 1 }),
    })
  );
});

test('opens and closes the React root inside the Obsidian content element', async () => {
  const editorView = createEditorView();

  await (editorView as EditorView & { onOpen(): Promise<void> }).onOpen();
  await editorView.onLoadFile(createFile('Open.md', 'md'));

  expect(createRoot).toHaveBeenCalledWith(editorView.contentEl);
  expect(editorView.contentEl).toHaveClass(LIBRE_NOTE_EDITOR_CONTENT_CLASS_NAME);

  expect(mockReactRoot.render).toHaveBeenLastCalledWith(
    expect.objectContaining({
      props: expect.objectContaining({
        activeFilePath: 'Open.md',
        importedHtmlSource: '<article>Loaded</article>',
      }),
      type: App,
    })
  );

  await (editorView as EditorView & { onClose(): Promise<void> }).onClose();

  expect(mockReactRoot.unmount).toHaveBeenCalledTimes(1);
  expect(editorView.contentEl.empty).toHaveBeenCalledTimes(2);
});

test('hides empty html message during the initial Obsidian view render', async () => {
  const editorView = createEditorView();

  await (editorView as EditorView & { onOpen(): Promise<void> }).onOpen();

  expect(mockReactRoot.render).toHaveBeenLastCalledWith(
    expect.objectContaining({
      props: expect.objectContaining({
        activeFilePath: null,
        importedHtmlSource: null,
        showHtmlEmptyState: false,
      }),
    })
  );
});

test('ignores unsupported files and clears state on unload', async () => {
  const loadImportedHtmlSource = jest.fn();
  const editorView = createEditorView(loadImportedHtmlSource);
  const textFile = createFile('Unsupported.txt', 'txt');

  await (editorView as EditorView & { onOpen(): Promise<void> }).onOpen();
  await editorView.onLoadFile(textFile);

  expect(loadImportedHtmlSource).not.toHaveBeenCalled();

  expect(mockReactRoot.render).toHaveBeenLastCalledWith(
    expect.objectContaining({
      props: expect.objectContaining({ activeFilePath: null, importedHtmlSource: null }),
    })
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

  await editorView.onLoadFile(createFile('Same.md', 'md'));
  await editorView.onRename(createFile('Other.md', 'md'));
  await editorView.onRename(createFile('Same.md', 'md'));

  expect(loadImportedHtmlSource).toHaveBeenCalledTimes(2);
});
