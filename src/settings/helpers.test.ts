import { DEFAULT_LIBRE_NOTE_EDITOR_SETTINGS } from './constants';
import {
  mergeLibreNoteEditorSettings,
  resolveActiveEditorSource,
  secondsToMilliseconds,
  validateIntervalSeconds,
} from './helpers';

test('loads default settings when saved data is missing', () => {
  expect(mergeLibreNoteEditorSettings(null)).toEqual(DEFAULT_LIBRE_NOTE_EDITOR_SETTINGS);
});

test('merges saved settings with new defaults', () => {
  const settings = mergeLibreNoteEditorSettings({
    settings: {
      autosaveIntervalSeconds: 10,
      editorMode: 'html-fallback',
      libreOfficePath: ' C:\\LibreOffice\\program\\soffice.exe ',
    },
  });

  expect(settings).toEqual({
    ...DEFAULT_LIBRE_NOTE_EDITOR_SETTINGS,
    autosaveIntervalSeconds: 10,
    editorMode: 'html-fallback',
    libreOfficePath: 'C:\\LibreOffice\\program\\soffice.exe',
  });
});

test('rejects invalid intervals before saving', () => {
  expect(validateIntervalSeconds('0')).toEqual({
    intervalSeconds: null,
    message: 'Use a value from 1 to 3600 seconds.',
    status: 'invalid',
  });

  expect(validateIntervalSeconds('1.5')).toEqual({
    intervalSeconds: null,
    message: 'Use a whole number of seconds.',
    status: 'invalid',
  });

  expect(validateIntervalSeconds('3601')).toEqual({
    intervalSeconds: null,
    message: 'Use a value from 1 to 3600 seconds.',
    status: 'invalid',
  });
});

test('converts valid interval seconds to milliseconds for autosave wiring', () => {
  expect(validateIntervalSeconds('15').intervalSeconds).toBe(15);
  expect(secondsToMilliseconds(15)).toBe(15000);
});

test('editor mode changes affect active source selection', () => {
  expect(
    resolveActiveEditorSource(
      { ...DEFAULT_LIBRE_NOTE_EDITOR_SETTINGS, editorMode: 'automatic' },
      { isRuntimeReady: true, platform: 'desktop' }
    )
  ).toBe('desktop-odt');

  expect(
    resolveActiveEditorSource(
      { ...DEFAULT_LIBRE_NOTE_EDITOR_SETTINGS, editorMode: 'automatic' },
      { isRuntimeReady: true, platform: 'mobile' }
    )
  ).toBe('html-fallback');

  expect(
    resolveActiveEditorSource(
      { ...DEFAULT_LIBRE_NOTE_EDITOR_SETTINGS, editorMode: 'html-fallback' },
      { isRuntimeReady: true, platform: 'desktop' }
    )
  ).toBe('html-fallback');
});
