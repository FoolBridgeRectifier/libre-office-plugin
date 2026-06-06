import { LIBRE_MARKDOWN_VIEW_TYPE, NATIVE_MARKDOWN_VIEW_TYPE } from './editor-view/constants';
import {
  createLeaf,
  createMarkdownFile,
  createMetadataCacheMock,
  createPluginMockArguments,
  createVaultMock,
  createWorkspaceMock,
  mockRichDocumentStore,
} from './mainTestHelpers';
import type { TFile, WorkspaceLeaf } from 'obsidian';

test('registers the Libre markdown view and routing events on load', async () => {
  const { default: LibreNoteEditorPlugin } = await import('./main');
  const workspace = createWorkspaceMock();
  const vault = createVaultMock();
  const openLeaf = createLeaf(createMarkdownFile('Open.md'));

  workspace.iterateAllLeaves.mockImplementation(
    (callback: (workspaceLeaf: WorkspaceLeaf) => void) => {
      callback(openLeaf);
    }
  );

  const plugin = new LibreNoteEditorPlugin(...createPluginMockArguments(vault, workspace));
  const addCommand = jest.mocked(plugin.addCommand);
  const registerEvent = jest.mocked(plugin.registerEvent);
  const registerView = jest.mocked(plugin.registerView);

  await plugin.onload();

  expect(registerView).toHaveBeenCalledWith(LIBRE_MARKDOWN_VIEW_TYPE, expect.any(Function));

  expect(addCommand).toHaveBeenCalledTimes(2);
  expect(registerEvent).toHaveBeenCalledTimes(5);
  expect(mockRichDocumentStore.getOrCreateMapping).toHaveBeenCalledWith('Open.md');
});

test('creates EditorView instances from the registered view factory', async () => {
  const { default: LibreNoteEditorPlugin } = await import('./main');
  const workspace = createWorkspaceMock();
  const vault = createVaultMock();

  const plugin = new LibreNoteEditorPlugin(...createPluginMockArguments(vault, workspace));
  const registerView = jest.mocked(plugin.registerView);

  await plugin.onload();

  const createView = registerView.mock.calls[0]?.[1] as (leaf: WorkspaceLeaf) => unknown;
  const editorView = createView(createLeaf(createMarkdownFile('Factory.md'))) as {
    onLoadFile(file: TFile): Promise<void>;
  };

  expect(editorView).toEqual(expect.objectContaining({ allowNoFile: true, navigation: true }));

  await editorView.onLoadFile(createMarkdownFile('Factory.md'));

  expect(mockRichDocumentStore.getOrCreateMapping).toHaveBeenCalledWith('Factory.md');
});

test('opens active markdown in the native markdown fallback command', async () => {
  const { default: LibreNoteEditorPlugin } = await import('./main');
  const workspace = createWorkspaceMock();
  const vault = createVaultMock();

  const markdownFile = createMarkdownFile('Fallback.md');
  const navigationLeaf = createLeaf(markdownFile);

  workspace.getActiveFile.mockReturnValue(markdownFile);
  workspace.getLeaf.mockReturnValue(navigationLeaf);

  const plugin = new LibreNoteEditorPlugin(...createPluginMockArguments(vault, workspace));
  const addCommand = jest.mocked(plugin.addCommand);

  await plugin.onload();

  const command = addCommand.mock.calls[0]?.[0] as {
    checkCallback(checking: boolean): boolean;
  };

  expect(command.checkCallback(true)).toBe(true);
  expect(command.checkCallback(false)).toBe(true);

  expect(navigationLeaf.setViewState).toHaveBeenCalledWith(
    expect.objectContaining({ type: NATIVE_MARKDOWN_VIEW_TYPE })
  );

  workspace.getMostRecentLeaf.mockReturnValue(navigationLeaf);
  workspace.eventHandlers.get('file-open')?.(markdownFile);

  expect(navigationLeaf.setViewState).toHaveBeenCalledTimes(1);
});

test('routes markdown file-open and active-leaf-change events', async () => {
  const { default: LibreNoteEditorPlugin } = await import('./main');
  const workspace = createWorkspaceMock();
  const vault = createVaultMock();

  const markdownFile = createMarkdownFile('Event.md');
  const navigationLeaf = createLeaf(markdownFile);

  workspace.getMostRecentLeaf.mockReturnValue(navigationLeaf);

  const plugin = new LibreNoteEditorPlugin(...createPluginMockArguments(vault, workspace));

  await plugin.onload();

  workspace.eventHandlers.get('file-open')?.(markdownFile);
  workspace.eventHandlers.get('active-leaf-change')?.(navigationLeaf);
  workspace.eventHandlers.get('active-leaf-change')?.(null);

  await Promise.resolve();

  expect(navigationLeaf.setViewState).toHaveBeenCalledWith(
    expect.objectContaining({ type: LIBRE_MARKDOWN_VIEW_TYPE })
  );
});

test('refreshes open Libre link warnings after metadata cache changes', async () => {
  const { default: LibreNoteEditorPlugin } = await import('./main');
  const metadataCache = createMetadataCacheMock();
  const workspace = createWorkspaceMock();
  const vault = createVaultMock();

  const plugin = new LibreNoteEditorPlugin(
    ...createPluginMockArguments(vault, workspace, metadataCache)
  );
  const registerView = jest.mocked(plugin.registerView);

  await plugin.onload();

  const createView = registerView.mock.calls[0]?.[1] as (leaf: WorkspaceLeaf) => unknown;
  const editorView = createView(createLeaf(createMarkdownFile('Refresh.md'))) as {
    refreshLinkWarnings(): void;
  };

  editorView.refreshLinkWarnings = jest.fn();
  workspace.iterateAllLeaves.mockImplementation((callback) => {
    callback({ view: editorView } as unknown as WorkspaceLeaf);
  });

  metadataCache.eventHandlers.get('changed')?.();

  expect(editorView.refreshLinkWarnings).toHaveBeenCalledTimes(1);
});

test('detaches Libre leaves on plugin unload', async () => {
  const { default: LibreNoteEditorPlugin } = await import('./main');
  const markdownFile = createMarkdownFile('Unload.md');
  const libreLeaf = createLeaf(markdownFile, LIBRE_MARKDOWN_VIEW_TYPE);

  const workspace = createWorkspaceMock();
  const vault = createVaultMock();

  workspace.getLeavesOfType.mockReturnValue([libreLeaf]);

  const plugin = new LibreNoteEditorPlugin(...createPluginMockArguments(vault, workspace));

  await plugin.onload();
  await plugin.onunload();

  expect(libreLeaf.detach).toHaveBeenCalledTimes(1);
});
