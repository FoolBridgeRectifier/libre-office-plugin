import { createElement } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '../../../App';
import { LIBRE_NOTE_EDITOR_CONTENT_CLASS_NAME } from '../../constants';
import { shouldRouteFileToLibreEditor } from '../../helpers';
import type { AutosaveStatus } from '../../../autosave/interfaces';
import type { ConflictResolutionChoice } from '../../../conflicts/interfaces';
import type { OfficeRuntimeSetupState } from '../../../office-runtime/interfaces';
import type {
  LibreNoteEditorActiveSource,
  LibreNoteEditorMode,
  LibreNoteEditorPageLayout,
} from '../../../settings/interfaces';
import type { EditorViewRenderTarget } from '../../interfaces';
import type { Root } from 'react-dom/client';
import type { TFile } from 'obsidian';

export function createEditorViewRoot(contentElement: HTMLElement): Root {
  contentElement.classList.add(LIBRE_NOTE_EDITOR_CONTENT_CLASS_NAME);

  return createRoot(contentElement);
}

function createEditorViewAppElement(
  activeMarkdownFile: TFile | null,
  activeEditorSource: LibreNoteEditorActiveSource,
  autosaveStatus: AutosaveStatus,
  desktopSourceStatus: 'idle' | 'loading' | 'error',
  editorMode: LibreNoteEditorMode,
  importedHtmlSource: string | null,
  isResolvingConflict: boolean,
  linkWarningCount: number,
  officeRuntimeSetupState: OfficeRuntimeSetupState,
  pageLayout: LibreNoteEditorPageLayout,
  showHtmlEmptyState: boolean,
  onEditorBlur: () => void,
  onHtmlSourceChange: (htmlSource: string) => void,
  onResolveConflict: (choice: ConflictResolutionChoice) => void
) {
  const activeFilePath = shouldRouteFileToLibreEditor(activeMarkdownFile)
    ? activeMarkdownFile.path
    : null;

  return createElement(App, {
    activeFilePath,
    activeEditorSource,
    autosaveStatus,
    desktopSourceStatus,
    editorMode,
    importedHtmlSource,
    isResolvingConflict,
    linkWarningCount,
    officeRuntimeSetupState,
    pageLayout,
    showHtmlEmptyState,
    onEditorBlur,
    onHtmlSourceChange,
    onResolveConflict,
  });
}

export function renderEditorViewAppElement(
  reactRoot: Root | null,
  target: EditorViewRenderTarget
): void {
  reactRoot?.render(
    createEditorViewAppElement(
      target.activeMarkdownFile,
      target.activeEditorSource,
      target.autosaveStatus,
      target.desktopSourceStatus,
      target.editorMode,
      target.importedHtmlSource,
      target.isResolvingConflict,
      target.linkWarningCount,
      target.officeRuntimeSetupState,
      target.pageLayout,
      target.showHtmlEmptyState,
      target.handleEditorBlur,
      target.handleHtmlSourceChange,
      target.handleResolveConflict
    )
  );
}
