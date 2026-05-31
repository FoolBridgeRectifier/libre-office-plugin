import type { TFile, ViewCreator, ViewState, Workspace, WorkspaceLeaf } from 'obsidian';

import {
  LIBRE_MARKDOWN_VIEW_TYPE,
  MARKDOWN_FILE_EXTENSIONS,
  NATIVE_MARKDOWN_VIEW_TYPE,
} from './constants';
import type { FileTrackingView, LibreMarkdownRegistrationTarget } from './interfaces';

export function createLibreMarkdownViewState(file: TFile, active: boolean): ViewState {
  return {
    active,
    state: {
      file: file.path,
    },
    type: LIBRE_MARKDOWN_VIEW_TYPE,
  };
}

export function createNativeMarkdownViewState(file: TFile, active: boolean): ViewState {
  return {
    active,
    state: {
      file: file.path,
    },
    type: NATIVE_MARKDOWN_VIEW_TYPE,
  };
}

export function detachLibreMarkdownLeaves(workspace: Workspace) {
  // Unload should remove our custom panes without touching native markdown panes.
  for (const workspaceLeaf of workspace.getLeavesOfType(LIBRE_MARKDOWN_VIEW_TYPE)) {
    workspaceLeaf.detach();
  }
}

export function getWorkspaceLeafFile(workspaceLeaf: WorkspaceLeaf) {
  // Native MarkdownView and our FileView both expose file on the view instance.
  const fileTrackingView = workspaceLeaf.view as Partial<FileTrackingView>;

  return fileTrackingView.file ?? null;
}

export function getWorkspaceLeafViewType(workspaceLeaf: WorkspaceLeaf) {
  return workspaceLeaf.view.getViewType();
}

export async function openFileInLibreEditor(workspaceLeaf: WorkspaceLeaf, file: TFile) {
  if (!shouldRouteFileToLibreEditor(file)) {
    return false;
  }

  // setViewState swaps the pane view while preserving the same Obsidian leaf.
  await workspaceLeaf.setViewState(createLibreMarkdownViewState(file, true));

  return true;
}

export async function openFileInNativeMarkdownView(workspaceLeaf: WorkspaceLeaf, file: TFile) {
  if (!shouldRouteFileToLibreEditor(file)) {
    return false;
  }

  // This is the escape hatch that restores Obsidian's built-in markdown editor.
  await workspaceLeaf.setViewState(createNativeMarkdownViewState(file, true));

  return true;
}

export function registerLibreMarkdownRouting(
  registrationTarget: LibreMarkdownRegistrationTarget,
  createView: ViewCreator
) {
  registrationTarget.registerView(LIBRE_MARKDOWN_VIEW_TYPE, createView);
}

export async function routeMostRecentMarkdownLeafToLibreEditor(
  workspace: Workspace,
  file: TFile | null
) {
  // file-open does not pass a leaf, so use Obsidian's current navigation target.
  return routeWorkspaceLeafToLibreEditor(workspace.getMostRecentLeaf(), file);
}

export async function routeWorkspaceLeafToLibreEditor(
  workspaceLeaf: WorkspaceLeaf | null,
  openedFile: TFile | null = null
) {
  // active-leaf-change has a leaf but may need to read the file from its view.
  const workspaceFile = openedFile ?? (workspaceLeaf ? getWorkspaceLeafFile(workspaceLeaf) : null);

  if (!workspaceLeaf || !shouldRouteFileToLibreEditor(workspaceFile)) {
    return false;
  }

  if (getWorkspaceLeafViewType(workspaceLeaf) === LIBRE_MARKDOWN_VIEW_TYPE) {
    return false;
  }

  return openFileInLibreEditor(workspaceLeaf, workspaceFile);
}

export async function routeOpenMarkdownLeavesToLibreEditor(workspace: Workspace) {
  const routingPromises: Promise<boolean>[] = [];

  // Layout restore can leave native markdown leaves open before the plugin loads.
  workspace.iterateAllLeaves((workspaceLeaf) => {
    if (getWorkspaceLeafViewType(workspaceLeaf) !== NATIVE_MARKDOWN_VIEW_TYPE) {
      return;
    }

    const workspaceFile = getWorkspaceLeafFile(workspaceLeaf);

    if (!shouldRouteFileToLibreEditor(workspaceFile)) {
      return;
    }

    routingPromises.push(routeWorkspaceLeafToLibreEditor(workspaceLeaf, workspaceFile));
  });

  await Promise.all(routingPromises);
}

export function shouldRouteFileToLibreEditor(file: TFile | null): file is TFile {
  return file !== null && shouldRoutePathToLibreEditor(file.path);
}

export function shouldRoutePathToLibreEditor(filePath: string): boolean {
  const fileExtension = filePath.split('.').pop()?.toLowerCase();

  return fileExtension === MARKDOWN_FILE_EXTENSIONS[0];
}
