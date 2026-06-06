import {
  ClipboardPaste24Regular,
  Eye24Regular,
  Image24Regular,
  Link24Regular,
  PaintBrush24Regular,
  Table24Regular,
  TextBold24Regular,
  TextItalic24Regular,
} from '@fluentui/react-icons';
import classNames from 'classnames';

import type { AutosaveStatus } from '../autosave/interfaces';
import type { RibbonTabDefinition } from './interfaces';
import type { LibreNoteEditorPageLayout } from '../settings/interfaces';

export function findRibbonTab(
  ribbonTabDefinitions: ReadonlyArray<RibbonTabDefinition>,
  activeRibbonTabId: string
) {
  const matchingRibbonTabDefinition = ribbonTabDefinitions.find(
    (ribbonTabDefinition) => ribbonTabDefinition.id === activeRibbonTabId
  );

  if (matchingRibbonTabDefinition) {
    return matchingRibbonTabDefinition;
  }

  const fallbackRibbonTabDefinition = ribbonTabDefinitions[0];

  if (fallbackRibbonTabDefinition) {
    return fallbackRibbonTabDefinition;
  }

  throw new Error('Ribbon tabs must include at least one tab.');
}

export function getCommandButtonClassName(isDisabledCommand: boolean) {
  return classNames(
    'flex min-w-16 flex-col items-center gap-1 rounded-ribbon-sm border px-2 py-1.5',
    'font-sans text-[10px] transition-colors duration-150 ease-ribbon-fast',
    'motion-reduce:transition-none',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
    'focus-visible:outline-button-focus-ring',
    isDisabledCommand
      ? 'border-ribbon-border text-text-disabled'
      : 'border-transparent text-text-primary hover:border-button-hover-border hover:bg-button-hover-bg'
  );
}

export function getEditorPageClassName(pageLayout: LibreNoteEditorPageLayout): string {
  return classNames(
    'relative min-h-72 w-full min-w-0 max-w-full rounded-ribbon-sm bg-ribbon-bg',
    'text-text-primary',
    pageLayout === 'page-width' ? 'libre-page-width p-0' : 'p-0'
  );
}

export function getCommandIcon(commandIconName: string) {
  switch (commandIconName) {
    case 'bold':
      return TextBold24Regular;
    case 'format-painter':
      return PaintBrush24Regular;
    case 'image':
      return Image24Regular;
    case 'italic':
      return TextItalic24Regular;
    case 'link':
      return Link24Regular;
    case 'paste':
      return ClipboardPaste24Regular;
    case 'preview':
      return Eye24Regular;
    case 'table':
      return Table24Regular;
    default:
      return Eye24Regular;
  }
}

export function getAutosaveStatusText(autosaveStatus: AutosaveStatus): string {
  switch (autosaveStatus) {
    case 'conflicted':
      return 'Conflict detected';
    case 'dirty':
      return 'Unsaved HTML changes';
    case 'error':
      return 'Autosave error';
    case 'saving':
      return 'Saving HTML';
    case 'syncing-markdown':
      return 'Syncing markdown';
    case 'saved':
      return 'HTML source saved';
  }
}

export function getLinkWarningStatusText(linkWarningCount: number): string {
  return linkWarningCount === 0
    ? 'No unresolved link targets'
    : `${linkWarningCount} unresolved link ${linkWarningCount === 1 ? 'target' : 'targets'}`;
}

export function getTabButtonClassName(isActiveRibbonTab: boolean) {
  return classNames(
    'min-h-8 whitespace-nowrap px-4 font-sans text-[11px] font-medium transition-colors',
    'duration-150 ease-ribbon-fast motion-reduce:transition-none',
    'focus-visible:outline focus-visible:outline-2',
    'focus-visible:outline-offset-[-2px] focus-visible:outline-button-focus-ring',
    isActiveRibbonTab ? 'bg-ribbon-bg text-text-primary' : 'text-white hover:bg-ribbon-purple-mid'
  );
}
