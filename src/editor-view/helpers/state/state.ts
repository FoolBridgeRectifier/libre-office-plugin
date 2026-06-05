import { shouldRouteFileToLibreEditor } from '../../helpers';
import type { AutosaveController } from '../../../autosave/interfaces';
import type {
  EditorViewLoadedState,
  EditorViewLoadedStateTarget,
  EditorViewOptions,
} from '../../interfaces';
import type { TFile } from 'obsidian';

export async function loadEditorViewHtmlSource(editorViewOptions: EditorViewOptions, file: TFile) {
  if (!shouldRouteFileToLibreEditor(file)) {
    return null;
  }

  return editorViewOptions.loadImportedHtmlSource(file);
}

export function getEditorViewLinkWarningCount(
  editorViewOptions: EditorViewOptions,
  file: TFile,
  htmlSource: string | null
): number {
  return htmlSource === null ? 0 : editorViewOptions.getLinkWarnings(file.path, htmlSource).length;
}

export async function loadEditorViewLoadedState(
  editorViewOptions: EditorViewOptions,
  file: TFile
): Promise<EditorViewLoadedState> {
  const htmlSource = await loadEditorViewHtmlSource(editorViewOptions, file);
  const autosaveStatus = (await editorViewOptions.getInitialAutosaveStatus?.(file)) ?? 'saved';

  return {
    autosaveStatus,
    htmlSource,
    linkWarningCount: getEditorViewLinkWarningCount(editorViewOptions, file, htmlSource),
  };
}

export function applyEditorViewLoadedState(
  target: EditorViewLoadedStateTarget,
  loadedState: EditorViewLoadedState
): void {
  target.autosaveStatus = loadedState.autosaveStatus;
  target.importedHtmlSource = loadedState.htmlSource;
  target.linkWarningCount = loadedState.linkWarningCount;
}

export function setEditorViewAutosaveDocument(
  autosaveController: AutosaveController,
  file: TFile,
  htmlSource: string | null
): void {
  if (htmlSource === null) {
    autosaveController.setActiveDocument(null);
    return;
  }

  autosaveController.setActiveDocument({ htmlSource, markdownPath: file.path });
}
