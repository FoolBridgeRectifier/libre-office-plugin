import { createAutosaveController } from '../../autosave/autosave';
import type {
  AutosaveController,
  AutosaveControllerOptions,
  AutosaveStatus,
} from '../../autosave/interfaces';
import type { EditorViewOptions } from '../interfaces';

export function createEditorViewAutosaveController(
  editorViewOptions: EditorViewOptions,
  onStatusChange: (autosaveStatus: AutosaveStatus) => void
): AutosaveController {
  const intervalOptions: Partial<AutosaveControllerOptions> = {
    ...(editorViewOptions.htmlAutosaveIntervalMs !== undefined
      ? { htmlAutosaveIntervalMs: editorViewOptions.htmlAutosaveIntervalMs }
      : {}),
    ...(editorViewOptions.markdownSyncIntervalMs !== undefined
      ? { markdownSyncIntervalMs: editorViewOptions.markdownSyncIntervalMs }
      : {}),
  };

  return createAutosaveController({
    ...intervalOptions,
    onStatusChange,
    saveHtmlSource: ({ htmlSource, markdownPath, previousHtmlSource }) =>
      editorViewOptions.saveHtmlSource(markdownPath, htmlSource, previousHtmlSource),
    syncMarkdownMirror: ({ htmlSource, markdownPath }) =>
      editorViewOptions.syncMarkdownMirror(markdownPath, htmlSource),
  });
}
