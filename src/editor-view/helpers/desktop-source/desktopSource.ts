import { getEditorViewLinkWarningCount, setEditorViewAutosaveDocument } from '../state/state';
import type { EditorViewDesktopSourceTarget } from '../../interfaces';

export async function syncEditorViewDesktopSource(
  target: EditorViewDesktopSourceTarget
): Promise<void> {
  await target.autosaveController.flushAll();

  if (target.autosaveStatus !== 'saved') {
    return;
  }

  if (!target.activeMarkdownFile || !target.editorViewOptions.syncDesktopSource) {
    return;
  }

  try {
    const syncedHtmlSource = await target.editorViewOptions.syncDesktopSource(
      target.activeMarkdownFile
    );

    applySyncedDesktopSource(target, syncedHtmlSource);
  } catch {
    target.autosaveStatus = 'error';
    target.desktopSourceStatus = 'error';
    target.renderReactApp();
  }
}

export async function refreshEditorViewDesktopSourceAfterLoad(
  target: EditorViewDesktopSourceTarget,
  loadedMarkdownFile: NonNullable<EditorViewDesktopSourceTarget['activeMarkdownFile']>
): Promise<void> {
  target.desktopSourceStatus = 'loading';
  target.renderReactApp();

  try {
    const syncedHtmlSource =
      (await target.editorViewOptions.syncDesktopSource?.(loadedMarkdownFile)) ?? null;

    if (target.activeMarkdownFile?.path !== loadedMarkdownFile.path) {
      return;
    }

    applySyncedDesktopSource(target, syncedHtmlSource);
    await target.editorViewOptions.prepareDesktopSource?.(loadedMarkdownFile);
  } catch {
    if (target.activeMarkdownFile?.path === loadedMarkdownFile.path) {
      target.autosaveStatus = 'error';
      target.desktopSourceStatus = 'error';
    }
  } finally {
    if (target.activeMarkdownFile?.path === loadedMarkdownFile.path) {
      if (target.desktopSourceStatus !== 'error') {
        target.desktopSourceStatus = 'idle';
      }

      target.renderReactApp();
    }
  }
}

function applySyncedDesktopSource(
  target: EditorViewDesktopSourceTarget,
  syncedHtmlSource: string | null
): void {
  if (
    syncedHtmlSource === null ||
    !target.activeMarkdownFile ||
    target.autosaveStatus !== 'saved'
  ) {
    return;
  }

  target.importedHtmlSource = syncedHtmlSource;

  setEditorViewAutosaveDocument(
    target.autosaveController,
    target.activeMarkdownFile,
    syncedHtmlSource
  );

  target.linkWarningCount = getEditorViewLinkWarningCount(
    target.editorViewOptions,
    target.activeMarkdownFile,
    syncedHtmlSource
  );

  target.autosaveStatus = 'saved';
  target.renderReactApp();
}
