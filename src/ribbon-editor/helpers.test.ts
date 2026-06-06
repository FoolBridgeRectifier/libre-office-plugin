import { Eye24Regular, TextBold24Regular } from '@fluentui/react-icons';

import {
  findRibbonTab,
  getAutosaveStatusText,
  getCommandButtonClassName,
  getCommandIcon,
  getEditorPageClassName,
  getTabButtonClassName,
} from './helpers';
import type { RibbonTabDefinition } from './interfaces';

const ribbonTabs: ReadonlyArray<RibbonTabDefinition> = [
  {
    commandGroups: [],
    id: 'home',
    label: 'Home',
  },
  {
    commandGroups: [],
    id: 'insert',
    label: 'Insert',
  },
];

test('finds matching ribbon tabs and falls back to the first tab', () => {
  expect(findRibbonTab(ribbonTabs, 'insert').id).toBe('insert');
  expect(findRibbonTab(ribbonTabs, 'missing').id).toBe('home');
});

test('throws when no ribbon tabs are available', () => {
  expect(() => findRibbonTab([], 'home')).toThrow('Ribbon tabs must include at least one tab.');
});

test('uses known command icons and preview as the unknown fallback', () => {
  expect(getCommandIcon('bold')).toBe(TextBold24Regular);
  expect(getCommandIcon('unknown')).toBe(Eye24Regular);
});

test('marks disabled command buttons with disabled text styling', () => {
  expect(getCommandButtonClassName(true)).toContain('text-text-disabled');
  expect(getCommandButtonClassName(false)).toContain('hover:bg-button-hover-bg');
});

test('keeps page-width layout chrome desktop-only', () => {
  const pageWidthClassName = getEditorPageClassName('page-width');

  expect(getEditorPageClassName('pageless')).toContain('max-w-full');
  expect(pageWidthClassName).toContain('p-0');
  expect(pageWidthClassName).toContain('libre-page-width');
});

test('uses reduced-motion classes for command and tab transitions', () => {
  expect(getCommandButtonClassName(false)).toContain('motion-reduce:transition-none');
  expect(getTabButtonClassName(false)).toContain('motion-reduce:transition-none');
});

test('maps autosave statuses to footer text', () => {
  expect(getAutosaveStatusText('dirty')).toBe('Unsaved HTML changes');
  expect(getAutosaveStatusText('error')).toBe('Autosave error');
  expect(getAutosaveStatusText('saved')).toBe('HTML source saved');

  expect(getAutosaveStatusText('saving')).toBe('Saving HTML');
  expect(getAutosaveStatusText('syncing-markdown')).toBe('Syncing markdown');
});
