import { PluginSettingTab, Setting } from 'obsidian';

import { CONFLICT_BEHAVIOR_OPTIONS, EDITOR_MODE_OPTIONS, PAGE_LAYOUT_OPTIONS } from './constants';
import { validateIntervalSeconds } from './helpers';
import { addSettingsDropdown } from './helpers/dropdown/dropdown';
import type {
  LibreNoteEditorConflictBehavior,
  LibreNoteEditorMode,
  LibreNoteEditorPageLayout,
  LibreNoteEditorSettingsPlugin,
} from './interfaces';

export class LibreNoteEditorSettingsTab extends PluginSettingTab {
  private readonly plugin: LibreNoteEditorSettingsPlugin;

  constructor(plugin: LibreNoteEditorSettingsPlugin) {
    super(plugin.app, plugin);

    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();
    containerEl.createEl('h2', { text: 'Libre Note Editor' });

    this.addLibreOfficePathSetting();
    this.addIntervalSetting('Autosave interval', 'autosaveIntervalSeconds');
    this.addIntervalSetting('Markdown sync interval', 'markdownSyncIntervalSeconds');
    this.addConflictBehaviorSetting();

    this.addEditorModeSetting();
    this.addPageLayoutSetting();
    this.addMarkdownFallbackSetting();
  }

  private addLibreOfficePathSetting(): void {
    new Setting(this.containerEl)
      .setName('LibreOffice path')
      .setDesc('Optional local executable path retained for setup visibility.')
      .addText((text) => {
        text
          .setPlaceholder('Bundled runtime is used by default')
          .setValue(this.plugin.settings.libreOfficePath)
          .onChange(async (libreOfficePath) => {
            await this.plugin.saveSettings({
              ...this.plugin.settings,
              libreOfficePath: libreOfficePath.trim(),
            });
          });

        text.inputEl.setAttribute('aria-label', 'LibreOffice path');
      });
  }

  private addIntervalSetting(
    label: string,
    settingKey: 'autosaveIntervalSeconds' | 'markdownSyncIntervalSeconds'
  ): void {
    const setting = new Setting(this.containerEl).setName(label).setDesc('Measured in seconds.');

    setting.addText((text) => {
      text.setValue(String(this.plugin.settings[settingKey])).onChange(async (intervalText) => {
        const validationResult = validateIntervalSeconds(intervalText);

        setting.setDesc(validationResult.message);

        if (validationResult.intervalSeconds === null) {
          return;
        }

        await this.plugin.saveSettings({
          ...this.plugin.settings,
          [settingKey]: validationResult.intervalSeconds,
        });
      });

      text.inputEl.setAttribute('aria-label', label);
    });
  }

  private addConflictBehaviorSetting(): void {
    addSettingsDropdown({
      containerElement: this.containerEl,
      currentValue: this.plugin.settings.conflictBehavior,
      description: 'Choose the default conflict recovery preference.',
      label: 'Conflict behavior',
      onChange: (conflictBehavior) =>
        this.plugin.saveSettings({
          ...this.plugin.settings,
          conflictBehavior: conflictBehavior as LibreNoteEditorConflictBehavior,
        }),
      options: CONFLICT_BEHAVIOR_OPTIONS,
    });
  }

  private addEditorModeSetting(): void {
    addSettingsDropdown({
      containerElement: this.containerEl,
      currentValue: this.plugin.settings.editorMode,
      label: 'Editor mode',
      onChange: (editorMode) =>
        this.plugin.saveSettings({
          ...this.plugin.settings,
          editorMode: editorMode as LibreNoteEditorMode,
        }),
      options: EDITOR_MODE_OPTIONS,
    });
  }

  private addPageLayoutSetting(): void {
    addSettingsDropdown({
      containerElement: this.containerEl,
      currentValue: this.plugin.settings.pageLayout,
      label: 'Editor layout',
      onChange: (pageLayout) =>
        this.plugin.saveSettings({
          ...this.plugin.settings,
          pageLayout: pageLayout as LibreNoteEditorPageLayout,
        }),
      options: PAGE_LAYOUT_OPTIONS,
    });
  }

  private addMarkdownFallbackSetting(): void {
    new Setting(this.containerEl)
      .setName('Show markdown source fallback')
      .setDesc('Expose the command that opens the active note in Obsidian markdown.')
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.showMarkdownSourceFallback).onChange((value) =>
          this.plugin.saveSettings({
            ...this.plugin.settings,
            showMarkdownSourceFallback: value,
          })
        );

        toggle.toggleEl.setAttribute('aria-label', 'Show markdown source fallback');
        toggle.toggleEl
          .querySelector('input')
          ?.setAttribute('aria-label', 'Show markdown source fallback');
      });
  }
}
