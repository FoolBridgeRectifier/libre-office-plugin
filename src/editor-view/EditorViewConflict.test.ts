import { EditorView } from './EditorView';
import { createFile } from './utils';
import type { ConflictResolutionChoice } from '../conflicts/interfaces';
import type { EditorViewOptions } from './interfaces';
import type { WorkspaceLeaf } from 'obsidian';

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

function createEditorView(options: Partial<EditorViewOptions> = {}) {
  const editorViewOptions: EditorViewOptions = {
    getInitialAutosaveStatus: jest.fn(async () => 'saved'),
    getLinkWarnings: jest.fn(() => []),
    loadImportedHtmlSource: jest.fn(async () => '<article>Loaded</article>'),
    resolveConflict: jest.fn(async () => '<article>Resolved</article>'),
    saveHtmlSource: jest.fn(),
    syncMarkdownMirror: jest.fn(),
    ...options,
  };

  return new EditorView({} as WorkspaceLeaf, editorViewOptions);
}

test('shows persisted conflict status when loading a conflicted markdown file', async () => {
  const editorView = createEditorView({
    getInitialAutosaveStatus: jest.fn(async () => 'conflicted'),
  });

  await (editorView as EditorView & { onOpen(): Promise<void> }).onOpen();
  await editorView.onLoadFile(createFile('Conflicted.md', 'md'));

  expect(mockReactRoot.render).toHaveBeenLastCalledWith(
    expect.objectContaining({
      props: expect.objectContaining({ autosaveStatus: 'conflicted' }),
    })
  );
});

test('resolves conflicts from the React app callback and refreshes html source', async () => {
  const resolveConflict = jest.fn(async () => '<article>Resolved</article>');
  const editorView = createEditorView({ resolveConflict });

  await (editorView as EditorView & { onOpen(): Promise<void> }).onOpen();
  await editorView.onLoadFile(createFile('Conflict.md', 'md'));

  const renderedElement = mockReactRoot.render.mock.calls.at(-1)?.[0] as {
    props: { onResolveConflict(choice: ConflictResolutionChoice): Promise<void> };
  };

  await renderedElement.props.onResolveConflict('desktop');

  const expectedResolvedProps = {
    autosaveStatus: 'saved',
    importedHtmlSource: '<article>Resolved</article>',
  };

  expect(resolveConflict).toHaveBeenCalledWith('Conflict.md', 'desktop');

  expect(mockReactRoot.render).toHaveBeenLastCalledWith(
    expect.objectContaining({
      props: expect.objectContaining(expectedResolvedProps),
    })
  );
});
