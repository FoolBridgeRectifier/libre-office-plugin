import { DEFAULT_LIBRE_NOTE_EDITOR_SETTINGS } from './constants';
import {
  mergeLibreNoteEditorSettings,
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
      pageLayout: 'page-width',
    },
  });

  expect(settings).toEqual({
    ...DEFAULT_LIBRE_NOTE_EDITOR_SETTINGS,
    autosaveIntervalSeconds: 10,
    pageLayout: 'page-width',
  });
});

test('drops old runtime and source-mode settings during migration', () => {
  const settings = mergeLibreNoteEditorSettings({
    settings: {
      editorMode: 'desktop-odt',
      libreOfficePath: 'C:\\LibreOffice\\program\\soffice.exe',
    },
  });

  expect(settings).toEqual(DEFAULT_LIBRE_NOTE_EDITOR_SETTINGS);
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

test('old html fallback mode normalizes safely to current defaults', () => {
  const settings = mergeLibreNoteEditorSettings({
    settings: {
      editorMode: 'html-fallback',
    },
  });

  expect(settings).toEqual(DEFAULT_LIBRE_NOTE_EDITOR_SETTINGS);
});
