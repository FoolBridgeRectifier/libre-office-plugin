import { shouldRouteFileToLibreEditor } from '../../helpers';
import type { AutosaveController } from '../../../autosave/interfaces';
import type {
  EditorViewLoadedState,
  EditorViewLoadedStateTarget,
  EditorViewOptions,
  EditorViewRenderTarget,
  EditorViewSourceTarget,
} from '../../interfaces';
import type { TFile } from 'obsidian';

async function loadEditorViewHtmlSource(editorViewOptions: EditorViewOptions, file: TFile) {
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

export function startEditorViewHtmlLoad(target: EditorViewLoadedStateTarget, file: TFile): boolean {
  const shouldClearActiveDocument = target.activeMarkdownFile?.path !== file.path;

  target.activeMarkdownFile = file;
  target.importedHtmlSource = null;
  target.showHtmlEmptyState = false;
  target.renderReactApp();

  return shouldClearActiveDocument;
}

export function applyEditorViewUnloadedState(target: EditorViewLoadedStateTarget): void {
  target.activeMarkdownFile = null;
  target.desktopSourceStatus = 'idle';
  target.importedHtmlSource = null;
  target.linkWarningCount = 0;

  target.showHtmlEmptyState = false;

  target.renderReactApp();
}

export function applyEditorViewHtmlSourceChange(
  target: EditorViewSourceTarget,
  htmlSource: string
): void {
  target.importedHtmlSource = htmlSource;

  if (target.activeMarkdownFile) {
    target.linkWarningCount = getEditorViewLinkWarningCount(
      target.editorViewOptions,
      target.activeMarkdownFile,
      htmlSource
    );
  }

  target.autosaveController.handleHtmlSourceChange(htmlSource);
}

export function refreshEditorViewSettingsState(
  target: EditorViewRenderTarget & { readonly editorViewOptions: EditorViewOptions }
): void {
  target.activeEditorSource = target.editorViewOptions.getActiveEditorSource?.() ?? 'desktop-odt';
  target.editorMode = target.editorViewOptions.getEditorMode?.() ?? 'automatic';
  target.pageLayout = target.editorViewOptions.getPageLayout?.() ?? 'pageless';
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
