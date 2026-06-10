import { createElement } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '../../App';
import { LIBRE_NOTE_EDITOR_CONTENT_CLASS_NAMES } from '../constants';
import { shouldRouteFileToLibreEditor } from '../helpers';
import type { AutosaveStatus } from '../../autosave/interfaces';
import type { ConflictResolutionChoice } from '../../conflicts/interfaces';
import type { LibreNoteEditorPageLayout } from '../../settings/interfaces';
import type { EditorViewRenderTarget } from '../interfaces';
import type { Root } from 'react-dom/client';
import type { TFile } from 'obsidian';

export function createEditorViewRoot(contentElement: HTMLElement): Root {
  contentElement.classList.add(...LIBRE_NOTE_EDITOR_CONTENT_CLASS_NAMES.split(' '));

  return createRoot(contentElement);
}

function createEditorViewAppElement(
  activeMarkdownFile: TFile | null,
  autosaveStatus: AutosaveStatus,
  importedHtmlSource: string | null,
  isResolvingConflict: boolean,
  linkWarningCount: number,
  pageLayout: LibreNoteEditorPageLayout,
  showHtmlEmptyState: boolean,
  onEditorBlur: () => void,
  onExternalLinkNavigate: (url: string) => void,
  onHtmlSourceChange: (htmlSource: string) => void,
  onInternalLinkNavigate: (target: string) => void,
  onResolveConflict: (choice: ConflictResolutionChoice) => void,
  onTagNavigate: (tagText: string) => void
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
    pageLayout,
    showHtmlEmptyState,
    onEditorBlur,
    onExternalLinkNavigate,
    onHtmlSourceChange,
    onInternalLinkNavigate,
    onResolveConflict,
    onTagNavigate,
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
      target.pageLayout,
      target.showHtmlEmptyState,
      target.handleEditorBlur,
      target.handleExternalLinkNavigate,
      target.handleHtmlSourceChange,
      target.handleInternalLinkNavigate,
      target.handleResolveConflict,
      target.handleTagNavigate
    )
  );
}
