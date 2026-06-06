import { getEditorViewLinkWarningCount, setEditorViewAutosaveDocument } from '../state/state';
import type { ConflictResolutionChoice } from '../../../conflicts/interfaces';
import type {
  EditorViewConflictResolutionResult,
  EditorViewConflictResolutionTarget,
} from '../../interfaces';

export async function resolveEditorViewConflict(
  target: EditorViewConflictResolutionTarget,
  choice: ConflictResolutionChoice
): Promise<EditorViewConflictResolutionResult | null> {
  if (!target.activeMarkdownFile || target.isResolvingConflict) {
    return null;
  }

  target.isResolvingConflict = true;
  target.autosaveStatus = 'saving';
  target.renderReactApp();

  try {
    const htmlSource = await target.editorViewOptions.resolveConflict(
      target.activeMarkdownFile.path,
      choice
    );

    setEditorViewAutosaveDocument(target.autosaveController, target.activeMarkdownFile, htmlSource);

    return {
      autosaveStatus: 'saved',
      htmlSource,
      linkWarningCount: getEditorViewLinkWarningCount(
        target.editorViewOptions,
        target.activeMarkdownFile,
        htmlSource
      ),
    };
  } catch {
    return {
      autosaveStatus: 'error',
      htmlSource: null,
      linkWarningCount: 0,
    };
  } finally {
    target.isResolvingConflict = false;
  }
}

export function applyEditorViewConflictResolutionResult(
  target: EditorViewConflictResolutionTarget,
  result: EditorViewConflictResolutionResult | null
): void {
  if (result === null) {
    return;
  }

  target.autosaveStatus = result.autosaveStatus;
  target.importedHtmlSource = result.htmlSource;
  target.linkWarningCount = result.linkWarningCount;
  target.renderReactApp();
}
