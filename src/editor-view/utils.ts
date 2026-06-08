import type { TFile, Workspace, WorkspaceLeaf } from 'obsidian';

export { createFile } from '../testFileHelpers';

export function createLeaf(viewType: string, file: TFile | null): WorkspaceLeaf {
  const workspaceLeaf = {} as WorkspaceLeaf;

  workspaceLeaf.detach = jest.fn();

  const getViewState = jest.fn(() => ({
    state: { file: file?.path },
    type: viewType,
  }));

  workspaceLeaf.getViewState = getViewState;
  workspaceLeaf.openFile = jest.fn().mockResolvedValue(undefined);
  workspaceLeaf.setViewState = jest.fn().mockResolvedValue(undefined);

  workspaceLeaf.view = Object.assign({} as WorkspaceLeaf['view'], {
    file,
    getViewType: () => viewType,
  });

  return workspaceLeaf;
}

export function createWorkspace(
  leaves: WorkspaceLeaf[],
  mostRecentLeaf: WorkspaceLeaf | null = null
): Workspace {
  const workspace = {} as Workspace;

  workspace.getLeavesOfType = jest.fn((viewType: string) =>
    leaves.filter((workspaceLeaf) => workspaceLeaf.view.getViewType() === viewType)
  );
  workspace.getMostRecentLeaf = jest.fn(() => mostRecentLeaf);

  workspace.iterateAllLeaves = jest.fn((callback: (workspaceLeaf: WorkspaceLeaf) => void) => {
    leaves.forEach(callback);
  });

  return workspace;
}
