import {
  LIBRE_MARKDOWN_VIEW_TYPE,
  MARKDOWN_FILE_EXTENSIONS,
  NATIVE_MARKDOWN_VIEW_TYPE,
} from './constants';
import {
  createLibreMarkdownViewState,
  createNativeMarkdownViewState,
  detachLibreMarkdownLeaves,
  getWorkspaceLeafFile,
  openFileInNativeMarkdownView,
  registerLibreMarkdownRouting,
  routeMostRecentMarkdownLeafToLibreEditor,
  routeOpenMarkdownLeavesToLibreEditor,
  routeWorkspaceLeafToLibreEditor,
  shouldRouteFileToLibreEditor,
} from './helpers';

import type { TFile, ViewCreator, Workspace, WorkspaceLeaf } from 'obsidian';

function createFile(path: string, extension: string): TFile {
  return {
    basename: path.replace(/\.[^.]+$/, ''),
    extension,
    name: path.split('/').pop() ?? path,
    path,
  } as TFile;
}

function createLeaf(viewType: string, file: TFile | null): WorkspaceLeaf {
  return {
    detach: jest.fn(),
    openFile: jest.fn().mockResolvedValue(undefined),
    setViewState: jest.fn().mockResolvedValue(undefined),
    view: {
      file,
      getViewType: () => viewType,
    },
  } as unknown as WorkspaceLeaf;
}

function createWorkspace(
  leaves: WorkspaceLeaf[],
  mostRecentLeaf: WorkspaceLeaf | null = null
): Workspace {
  return {
    getLeavesOfType: jest.fn((viewType: string) =>
      leaves.filter((workspaceLeaf) => workspaceLeaf.view.getViewType() === viewType)
    ),
    getMostRecentLeaf: jest.fn(() => mostRecentLeaf),
    iterateAllLeaves: jest.fn((callback: (workspaceLeaf: WorkspaceLeaf) => void) => {
      for (const workspaceLeaf of leaves) {
        callback(workspaceLeaf);
      }
    }),
  } as unknown as Workspace;
}

test('defines markdown routing constants', () => {
  expect(LIBRE_MARKDOWN_VIEW_TYPE).toBe('libre-note-editor-view');
  expect(NATIVE_MARKDOWN_VIEW_TYPE).toBe('markdown');
  expect(MARKDOWN_FILE_EXTENSIONS).toContain('md');
});

test('detects markdown files and handles missing active files safely', () => {
  expect(shouldRouteFileToLibreEditor(createFile('Daily.md', 'md'))).toBe(true);
  expect(shouldRouteFileToLibreEditor(createFile('Archive.MD', 'MD'))).toBe(true);
  expect(shouldRouteFileToLibreEditor(createFile('Image.png', 'png'))).toBe(false);
  expect(shouldRouteFileToLibreEditor(null)).toBe(false);
});

test('creates Libre and native markdown view states for a file path', () => {
  const markdownFile = createFile('Folder/Note.md', 'md');

  expect(createLibreMarkdownViewState(markdownFile, true)).toMatchObject({
    active: true,
    state: { file: 'Folder/Note.md' },
    type: LIBRE_MARKDOWN_VIEW_TYPE,
  });

  expect(createNativeMarkdownViewState(markdownFile, false)).toMatchObject({
    active: false,
    state: { file: 'Folder/Note.md' },
    type: NATIVE_MARKDOWN_VIEW_TYPE,
  });
});

test('registers the Libre markdown view', () => {
  const registrationTarget = {
    registerView: jest.fn(),
  };

  const createView = jest.fn() as ViewCreator;

  registerLibreMarkdownRouting(registrationTarget, createView);

  expect(registrationTarget.registerView).toHaveBeenCalledWith(
    LIBRE_MARKDOWN_VIEW_TYPE,
    createView
  );
});

test('routes only native markdown leaves into Libre editor', async () => {
  const markdownFile = createFile('Routed.md', 'md');
  const ignoredTextFile = createFile('Ignored.txt', 'txt');
  const markdownLeaf = createLeaf(NATIVE_MARKDOWN_VIEW_TYPE, markdownFile);
  const textLeaf = createLeaf(NATIVE_MARKDOWN_VIEW_TYPE, ignoredTextFile);

  const libreLeaf = createLeaf(LIBRE_MARKDOWN_VIEW_TYPE, markdownFile);
  const missingFileLeaf = createLeaf(NATIVE_MARKDOWN_VIEW_TYPE, null);

  await routeOpenMarkdownLeavesToLibreEditor(
    createWorkspace([markdownLeaf, textLeaf, libreLeaf, missingFileLeaf])
  );

  expect(markdownLeaf.setViewState).toHaveBeenCalledWith(
    createLibreMarkdownViewState(markdownFile, true)
  );

  expect(textLeaf.setViewState).not.toHaveBeenCalled();
  expect(libreLeaf.setViewState).not.toHaveBeenCalled();
  expect(missingFileLeaf.setViewState).not.toHaveBeenCalled();
});

test('routes the most recent markdown leaf when a markdown file opens', async () => {
  const markdownFile = createFile('Active.md', 'md');
  const mostRecentLeaf = createLeaf(NATIVE_MARKDOWN_VIEW_TYPE, markdownFile);
  const workspace = createWorkspace([mostRecentLeaf], mostRecentLeaf);

  expect(await routeMostRecentMarkdownLeafToLibreEditor(workspace, markdownFile)).toBe(true);
  expect(mostRecentLeaf.setViewState).toHaveBeenCalledWith(
    createLibreMarkdownViewState(markdownFile, true)
  );
});

test('ignores recent leaf routing when the opened file or recent leaf is missing', async () => {
  const markdownFile = createFile('Active.md', 'md');
  const mostRecentLeaf = createLeaf(NATIVE_MARKDOWN_VIEW_TYPE, markdownFile);

  expect(
    await routeMostRecentMarkdownLeafToLibreEditor(createWorkspace([mostRecentLeaf]), markdownFile)
  ).toBe(false);

  const missingFileLeaf = createLeaf(NATIVE_MARKDOWN_VIEW_TYPE, null);

  expect(
    await routeMostRecentMarkdownLeafToLibreEditor(
      createWorkspace([missingFileLeaf], missingFileLeaf),
      null
    )
  ).toBe(false);

  expect(mostRecentLeaf.setViewState).not.toHaveBeenCalled();
  expect(missingFileLeaf.setViewState).not.toHaveBeenCalled();
});

test('routes a specific markdown leaf using its tracked file', async () => {
  const markdownFile = createFile('Tracked.md', 'md');
  const markdownLeaf = createLeaf(NATIVE_MARKDOWN_VIEW_TYPE, markdownFile);

  expect(await routeWorkspaceLeafToLibreEditor(markdownLeaf)).toBe(true);
  expect(markdownLeaf.setViewState).toHaveBeenCalledWith(
    createLibreMarkdownViewState(markdownFile, true)
  );
});

test('detaches only Libre markdown view leaves on unload', () => {
  const markdownFile = createFile('Open.md', 'md');
  const libreLeaf = createLeaf(LIBRE_MARKDOWN_VIEW_TYPE, markdownFile);
  const nativeLeaf = createLeaf(NATIVE_MARKDOWN_VIEW_TYPE, markdownFile);

  detachLibreMarkdownLeaves(createWorkspace([libreLeaf, nativeLeaf]));

  expect(libreLeaf.detach).toHaveBeenCalledTimes(1);
  expect(nativeLeaf.detach).not.toHaveBeenCalled();
});

test('opens the native markdown fallback only for markdown files', async () => {
  const markdownFile = createFile('Fallback.md', 'md');
  const markdownLeaf = createLeaf(LIBRE_MARKDOWN_VIEW_TYPE, markdownFile);
  const textLeaf = createLeaf(LIBRE_MARKDOWN_VIEW_TYPE, createFile('Nope.txt', 'txt'));

  expect(await openFileInNativeMarkdownView(markdownLeaf, markdownFile)).toBe(true);
  expect(await openFileInNativeMarkdownView(textLeaf, createFile('Nope.txt', 'txt'))).toBe(false);

  expect(markdownLeaf.setViewState).toHaveBeenCalledWith(
    createNativeMarkdownViewState(markdownFile, true)
  );

  expect(textLeaf.setViewState).not.toHaveBeenCalled();
});

test('reads a leaf file when the view provides one', () => {
  const markdownFile = createFile('Tracked.md', 'md');

  expect(getWorkspaceLeafFile(createLeaf(NATIVE_MARKDOWN_VIEW_TYPE, markdownFile))).toBe(
    markdownFile
  );
  expect(getWorkspaceLeafFile(createLeaf(NATIVE_MARKDOWN_VIEW_TYPE, null))).toBe(null);
});
