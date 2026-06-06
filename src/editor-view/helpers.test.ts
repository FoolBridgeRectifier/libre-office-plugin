import { LIBRE_MARKDOWN_VIEW_TYPE, NATIVE_MARKDOWN_VIEW_TYPE } from './constants';
import { createFile, createLeaf, createWorkspace } from './utils';
import {
  createLibreMarkdownViewState,
  createNativeMarkdownViewState,
  detachLibreMarkdownLeaves,
  getWorkspaceLeafFile,
  getWorkspaceLeafViewType,
  openFileInNativeMarkdownView,
  registerLibreMarkdownRouting,
  routeMostRecentMarkdownLeafToLibreEditor,
  routeOpenMarkdownLeavesToLibreEditor,
  routeWorkspaceLeafToLibreEditor,
  shouldRouteFileToLibreEditor,
  shouldRoutePathToLibreEditor,
} from './helpers';

import type { ViewCreator, WorkspaceLeaf } from 'obsidian';

test('detects markdown files and handles missing active files safely', () => {
  expect(shouldRouteFileToLibreEditor(createFile('Daily.md', 'md'))).toBe(true);
  expect(shouldRouteFileToLibreEditor(createFile('Archive.MD', 'MD'))).toBe(true);
  expect(shouldRouteFileToLibreEditor(createFile('Image.png', 'png'))).toBe(false);
  expect(shouldRouteFileToLibreEditor(null)).toBe(false);

  expect(shouldRoutePathToLibreEditor('Folder/Uppercase.MD')).toBe(true);
  expect(shouldRoutePathToLibreEditor('Folder/NotMarkdown.txt')).toBe(false);
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

test('restores Libre markdown view leaves to native markdown on unload', async () => {
  const markdownFile = createFile('Open.md', 'md');
  const libreLeaf = createLeaf(LIBRE_MARKDOWN_VIEW_TYPE, markdownFile);
  const nativeLeaf = createLeaf(NATIVE_MARKDOWN_VIEW_TYPE, markdownFile);

  await detachLibreMarkdownLeaves(createWorkspace([libreLeaf, nativeLeaf]));

  expect(libreLeaf.setViewState).toHaveBeenCalledWith(
    createNativeMarkdownViewState(markdownFile, true)
  );

  expect(libreLeaf.detach).not.toHaveBeenCalled();
  expect(nativeLeaf.detach).not.toHaveBeenCalled();
});

test('restores Libre leaves from view state when the file handle was cleared', async () => {
  const markdownFile = createFile('State.md', 'md');
  const libreLeaf = createLeaf(LIBRE_MARKDOWN_VIEW_TYPE, markdownFile);

  Object.assign(libreLeaf.view, { file: null });

  await detachLibreMarkdownLeaves(createWorkspace([libreLeaf]));

  expect(libreLeaf.setViewState).toHaveBeenCalledWith(
    createNativeMarkdownViewState('State.md', true)
  );
  expect(libreLeaf.detach).not.toHaveBeenCalled();
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

test('treats leaves without view type accessors as unroutable', () => {
  const transitionalLeaf = { view: {} } as WorkspaceLeaf;

  expect(getWorkspaceLeafViewType(transitionalLeaf)).toBe(null);
});
