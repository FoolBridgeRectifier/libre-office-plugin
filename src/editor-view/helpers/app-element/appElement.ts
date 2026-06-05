import { createElement } from 'react';

import { App } from '../../../App';
import { shouldRouteFileToLibreEditor } from '../../helpers';
import type { AutosaveStatus } from '../../../autosave/interfaces';
import type { TFile } from 'obsidian';

export function createEditorViewAppElement(
  activeMarkdownFile: TFile | null,
  autosaveStatus: AutosaveStatus,
  importedHtmlSource: string | null,
  linkWarningCount: number,
  onEditorBlur: () => void,
  onHtmlSourceChange: (htmlSource: string) => void
) {
  const activeFilePath = shouldRouteFileToLibreEditor(activeMarkdownFile)
    ? activeMarkdownFile.path
    : null;

  return createElement(App, {
    activeFilePath,
    autosaveStatus,
    importedHtmlSource,
    linkWarningCount,
    onEditorBlur,
    onHtmlSourceChange,
  });
}
