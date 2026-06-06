import { createElement } from 'react';

import { App } from '../../../App';
import { shouldRouteFileToLibreEditor } from '../../helpers';
import type { AutosaveStatus } from '../../../autosave/interfaces';
import type { ConflictResolutionChoice } from '../../../conflicts/interfaces';
import type { OfficeRuntimeSetupState } from '../../../office-runtime/interfaces';
import type { EditorViewRenderTarget } from '../../interfaces';
import type { Root } from 'react-dom/client';
import type { TFile } from 'obsidian';

export function createEditorViewAppElement(
  activeMarkdownFile: TFile | null,
  autosaveStatus: AutosaveStatus,
  desktopSourceStatus: 'idle' | 'loading' | 'error',
  importedHtmlSource: string | null,
  isResolvingConflict: boolean,
  linkWarningCount: number,
  officeRuntimeSetupState: OfficeRuntimeSetupState,
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
    autosaveStatus,
    desktopSourceStatus,
    importedHtmlSource,
    isResolvingConflict,
    linkWarningCount,
    officeRuntimeSetupState,
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
      target.autosaveStatus,
      target.desktopSourceStatus,
      target.importedHtmlSource,
      target.isResolvingConflict,
      target.linkWarningCount,
      target.officeRuntimeSetupState,
      target.showHtmlEmptyState,
      target.handleEditorBlur,
      target.handleHtmlSourceChange,
      target.handleResolveConflict
    )
  );
}
