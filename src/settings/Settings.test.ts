import { fireEvent, screen } from '@testing-library/dom';

import '../mainTestHelpers';
import { DEFAULT_LIBRE_NOTE_EDITOR_SETTINGS } from './constants';
import { LibreNoteEditorSettingsTab } from './Settings';
import type { LibreNoteEditorSettingsPlugin } from './interfaces';

beforeEach(() => {
  document.body.innerHTML = '';
});

test('renders settings UI with persisted defaults', () => {
  const plugin = createSettingsPlugin();
  const settingsTab = new LibreNoteEditorSettingsTab(plugin);

  settingsTab.display();
  document.body.appendChild(settingsTab.containerEl);

  expect(screen.getByLabelText('LibreOffice path')).toHaveValue('');
  expect(screen.getByLabelText('Autosave interval')).toHaveValue('5');
  expect(screen.getByLabelText('Markdown sync interval')).toHaveValue('30');
  expect(screen.getByLabelText('Editor mode')).toHaveValue('automatic');

  expect(settingsTab.containerEl).toMatchSnapshot();
});

test('does not save invalid interval settings', async () => {
  const plugin = createSettingsPlugin();
  const settingsTab = new LibreNoteEditorSettingsTab(plugin);

  settingsTab.display();
  document.body.appendChild(settingsTab.containerEl);

  fireEvent.change(screen.getByLabelText('Autosave interval'), { target: { value: '0' } });
  await Promise.resolve();

  expect(plugin.saveSettings).not.toHaveBeenCalled();
  expect(settingsTab.containerEl).toHaveTextContent('Use a value from 1 to 3600 seconds.');
});

test('persists valid editor mode changes', async () => {
  const plugin = createSettingsPlugin();
  const settingsTab = new LibreNoteEditorSettingsTab(plugin);

  settingsTab.display();
  document.body.appendChild(settingsTab.containerEl);

  fireEvent.change(screen.getByLabelText('Editor mode'), { target: { value: 'html-fallback' } });
  await Promise.resolve();

  expect(plugin.saveSettings).toHaveBeenCalledWith({
    ...DEFAULT_LIBRE_NOTE_EDITOR_SETTINGS,
    editorMode: 'html-fallback',
  });
});

function createSettingsPlugin(): LibreNoteEditorSettingsPlugin {
  const plugin = {
    app: {},
    saveSettings: jest.fn(async () => undefined),
    settings: DEFAULT_LIBRE_NOTE_EDITOR_SETTINGS,
  } as unknown as LibreNoteEditorSettingsPlugin;

  return plugin;
}
