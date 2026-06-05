import { createElement } from 'react';

import { App } from '../../../App';
import { shouldRouteFileToLibreEditor } from '../../helpers';
import type { AutosaveStatus } from '../../../autosave/interfaces';
import type { ConflictResolutionChoice } from '../../../conflicts/interfaces';
import type { EditorViewRenderTarget } from '../../interfaces';
import type { Root } from 'react-dom/client';
import type { TFile } from 'obsidian';

export function createEditorViewAppElement(
  activeMarkdownFile: TFile | null,
  autosaveStatus: AutosaveStatus,
  importedHtmlSource: string | null,
  isResolvingConflict: boolean,
  linkWarningCount: number,
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
    importedHtmlSource,
    isResolvingConflict,
    linkWarningCount,
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
      target.importedHtmlSource,
      target.isResolvingConflict,
      target.linkWarningCount,
      target.handleEditorBlur,
      target.handleHtmlSourceChange,
      target.handleResolveConflict
    )
  );
}
