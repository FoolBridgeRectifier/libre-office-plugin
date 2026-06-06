import type { TFile, ViewCreator, ViewState, Workspace, WorkspaceLeaf } from 'obsidian';

import {
  LIBRE_MARKDOWN_VIEW_TYPE,
  MARKDOWN_FILE_EXTENSIONS,
  NATIVE_MARKDOWN_VIEW_TYPE,
} from './constants';
import type { FileTrackingView, LibreMarkdownRegistrationTarget } from './interfaces';

export function createLibreMarkdownViewState(file: TFile | string, active: boolean): ViewState {
  return {
    active,
    state: {
      file: getFilePath(file),
    },
    type: LIBRE_MARKDOWN_VIEW_TYPE,
  };
}

export function createNativeMarkdownViewState(file: TFile | string, active: boolean): ViewState {
  return {
    active,
    state: {
      file: getFilePath(file),
    },
    type: NATIVE_MARKDOWN_VIEW_TYPE,
  };
}

function getFilePath(file: TFile | string): string {
  return typeof file === 'string' ? file : file.path;
}

export function getWorkspaceLeafFile(workspaceLeaf: WorkspaceLeaf) {
  const fileTrackingView = workspaceLeaf.view as Partial<FileTrackingView>;

  return fileTrackingView.file ?? null;
}

export function getWorkspaceLeafViewType(workspaceLeaf: WorkspaceLeaf) {
  const fileTrackingView = workspaceLeaf.view as Partial<FileTrackingView>;

  return typeof fileTrackingView.getViewType === 'function' ? fileTrackingView.getViewType() : null;
}

export async function openFileInLibreEditor(workspaceLeaf: WorkspaceLeaf, file: TFile) {
  if (!shouldRouteFileToLibreEditor(file)) {
    return false;
  }

  await workspaceLeaf.setViewState(createLibreMarkdownViewState(file, true));

  return true;
}

export async function openFileInNativeMarkdownView(workspaceLeaf: WorkspaceLeaf, file: TFile) {
  if (!shouldRouteFileToLibreEditor(file)) {
    return false;
  }

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
  return routeWorkspaceLeafToLibreEditor(workspace.getMostRecentLeaf(), file);
}

export async function routeWorkspaceLeafToLibreEditor(
  workspaceLeaf: WorkspaceLeaf | null,
  openedFile: TFile | null = null
) {
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

export function shouldSkipNativeFallbackRouting(
  workspaceLeaf: WorkspaceLeaf | null,
  nativeFallbackLeaves: WeakSet<WorkspaceLeaf>
): boolean {
  return workspaceLeaf !== null && nativeFallbackLeaves.has(workspaceLeaf);
}

export function shouldRoutePathToLibreEditor(filePath: string): boolean {
  const fileExtension = filePath.split('.').pop()?.toLowerCase();

  return fileExtension === MARKDOWN_FILE_EXTENSIONS[0];
}

export { detachLibreMarkdownLeaves } from './helpers/unload/unload';
