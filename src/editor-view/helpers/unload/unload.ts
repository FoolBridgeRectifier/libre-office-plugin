import {
  LIBRE_MARKDOWN_VIEW_TYPE,
  MARKDOWN_FILE_EXTENSIONS,
  NATIVE_MARKDOWN_VIEW_TYPE,
} from '../../constants';
import type { Workspace, WorkspaceLeaf } from 'obsidian';

export async function detachLibreMarkdownLeaves(workspace: Workspace): Promise<void> {
  const restorationPromises: Promise<void>[] = [];

  workspace.getLeavesOfType(LIBRE_MARKDOWN_VIEW_TYPE).forEach((workspaceLeaf) => {
    const workspaceFilePath = getWorkspaceLeafFilePath(workspaceLeaf);

    if (!workspaceFilePath || !shouldRestorePathToNativeMarkdown(workspaceFilePath)) {
      workspaceLeaf.detach();
      return;
    }

    restorationPromises.push(
      workspaceLeaf.setViewState({
        active: true,
        state: { file: workspaceFilePath },
        type: NATIVE_MARKDOWN_VIEW_TYPE,
      })
    );
  });

  await Promise.all(restorationPromises);
}

function getWorkspaceLeafFilePath(workspaceLeaf: WorkspaceLeaf): string | null {
  const viewFilePath = getWorkspaceLeafViewFilePath(workspaceLeaf);
  const stateFilePath = workspaceLeaf.getViewState?.().state?.file;

  return viewFilePath ?? (typeof stateFilePath === 'string' ? stateFilePath : null);
}

function getWorkspaceLeafViewFilePath(workspaceLeaf: WorkspaceLeaf): string | null {
  const fileTrackingView = workspaceLeaf.view as { readonly file?: { readonly path?: unknown } };
  const filePath = fileTrackingView.file?.path;

  return typeof filePath === 'string' ? filePath : null;
}

function shouldRestorePathToNativeMarkdown(filePath: string): boolean {
  const fileExtension = filePath.split('.').pop()?.toLowerCase();

  return fileExtension === MARKDOWN_FILE_EXTENSIONS[0];
}
