import {
  DEFAULT_LIBRE_NOTE_EDITOR_SETTINGS,
  MAX_INTERVAL_SECONDS,
  MIN_INTERVAL_SECONDS,
} from './constants';
import type { Workspace } from 'obsidian';
import type { OfficeRuntimeSetupState } from '../office-runtime/interfaces';
import type {
  IntervalValidationResult,
  LibreNoteEditorActiveSource,
  LibreNoteEditorConflictBehavior,
  LibreNoteEditorMode,
  LibreNoteEditorPageLayout,
  LibreNoteEditorSettings,
  LibreNoteEditorSettingsPersistenceTarget,
  LibreNoteEditorSourceEnvironment,
} from './interfaces';

export async function loadLibreNoteEditorSettings(
  target: LibreNoteEditorSettingsPersistenceTarget
): Promise<LibreNoteEditorSettings> {
  return mergeLibreNoteEditorSettings(await target.loadData());
}

export function mergeLibreNoteEditorSettings(data: unknown): LibreNoteEditorSettings {
  const storedSettings = getStoredSettings(data);

  return {
    autosaveIntervalSeconds: getValidInterval(
      storedSettings.autosaveIntervalSeconds,
      DEFAULT_LIBRE_NOTE_EDITOR_SETTINGS.autosaveIntervalSeconds
    ),
    conflictBehavior: getConflictBehavior(storedSettings.conflictBehavior),
    editorMode: getEditorMode(storedSettings.editorMode),
    libreOfficePath: getString(storedSettings.libreOfficePath) ?? '',
    markdownSyncIntervalSeconds: getValidInterval(
      storedSettings.markdownSyncIntervalSeconds,
      DEFAULT_LIBRE_NOTE_EDITOR_SETTINGS.markdownSyncIntervalSeconds
    ),
    pageLayout: getPageLayout(storedSettings.pageLayout),
    showMarkdownSourceFallback:
      typeof storedSettings.showMarkdownSourceFallback === 'boolean'
        ? storedSettings.showMarkdownSourceFallback
        : DEFAULT_LIBRE_NOTE_EDITOR_SETTINGS.showMarkdownSourceFallback,
  };
}

export function resolveActiveEditorSource(
  settings: LibreNoteEditorSettings,
  environment: LibreNoteEditorSourceEnvironment
): LibreNoteEditorActiveSource {
  if (settings.editorMode === 'html-fallback' || environment.platform === 'mobile') {
    return 'html-fallback';
  }

  return environment.isRuntimeReady ? 'desktop-odt' : 'html-fallback';
}

export function getLibreNoteEditorActiveSource(
  settings: LibreNoteEditorSettings,
  officeRuntimeSetupState: OfficeRuntimeSetupState,
  isMobile: boolean
): LibreNoteEditorActiveSource {
  return resolveActiveEditorSource(settings, {
    isRuntimeReady: officeRuntimeSetupState.status === 'ready',
    platform: isMobile ? 'mobile' : 'desktop',
  });
}

export function refreshOpenLibreNoteEditorViews(workspace: Workspace): void {
  workspace.iterateAllLeaves((workspaceLeaf) => {
    const maybeEditorView = workspaceLeaf.view as { renderReactApp?: () => void };

    maybeEditorView.renderReactApp?.();
  });
}

export async function saveLibreNoteEditorSettings(
  target: LibreNoteEditorSettingsPersistenceTarget,
  settings: LibreNoteEditorSettings
): Promise<void> {
  await target.saveData({ settings });
}

export function secondsToMilliseconds(intervalSeconds: number): number {
  return intervalSeconds * 1000;
}

export function validateIntervalSeconds(value: string): IntervalValidationResult {
  const trimmedValue = value.trim();
  const intervalSeconds = Number(trimmedValue);

  if (!/^\d+$/.test(trimmedValue) || !Number.isSafeInteger(intervalSeconds)) {
    return createInvalidIntervalResult('Use a whole number of seconds.');
  }

  if (intervalSeconds < MIN_INTERVAL_SECONDS || intervalSeconds > MAX_INTERVAL_SECONDS) {
    return createInvalidIntervalResult(
      `Use a value from ${MIN_INTERVAL_SECONDS} to ${MAX_INTERVAL_SECONDS} seconds.`
    );
  }

  return { intervalSeconds, message: 'Interval saved.', status: 'valid' };
}

function createInvalidIntervalResult(message: string): IntervalValidationResult {
  return { intervalSeconds: null, message, status: 'invalid' };
}

function getConflictBehavior(value: unknown): LibreNoteEditorConflictBehavior {
  return value === 'keep-html' || value === 'keep-markdown' || value === 'manual'
    ? value
    : DEFAULT_LIBRE_NOTE_EDITOR_SETTINGS.conflictBehavior;
}

function getEditorMode(value: unknown): LibreNoteEditorMode {
  return value === 'desktop-odt' || value === 'html-fallback' || value === 'automatic'
    ? value
    : DEFAULT_LIBRE_NOTE_EDITOR_SETTINGS.editorMode;
}

function getPageLayout(value: unknown): LibreNoteEditorPageLayout {
  return value === 'page-width' || value === 'pageless'
    ? value
    : DEFAULT_LIBRE_NOTE_EDITOR_SETTINGS.pageLayout;
}

function getStoredSettings(data: unknown): Partial<LibreNoteEditorSettings> {
  const dataRecord = isRecord(data) ? data : {};
  const nestedSettings = isRecord(dataRecord.settings) ? dataRecord.settings : dataRecord;

  return nestedSettings as Partial<LibreNoteEditorSettings>;
}

function getString(value: unknown): string | null {
  return typeof value === 'string' ? value.trim() : null;
}

function getValidInterval(value: unknown, fallback: number): number {
  const validationResult = validateIntervalSeconds(String(value ?? ''));

  return validationResult.intervalSeconds ?? fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
