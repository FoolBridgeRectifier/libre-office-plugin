# Settings Module

## What It Does

`settings` owns persisted plugin settings, the Obsidian settings tab, interval validation, and open-view refresh after setting changes.

Settings control autosave intervals, Markdown sync interval, conflict behavior preference, page layout, and native Markdown fallback visibility.

## Main Components

- `Settings.ts` defines `LibreNoteEditorSettingsTab`, the Obsidian settings UI.
- `helpers.ts` loads, normalizes, saves, validates, and applies settings. It refreshes open editor views after settings changes.
- `interfaces.ts` defines settings unions, persisted settings shape, settings plugin contract, and interval validation result.
- `constants.ts` defines defaults, interval bounds, and dropdown options.
- `dropdown/dropdown.ts` adds typed Obsidian dropdown settings.
- `index.ts` re-exports the public settings APIs.

## How It Is Used

`main.ts` loads settings during plugin startup, registers the settings tab, saves user changes through `saveSettings`, and passes settings accessors into `editor-view/options`. `ribbon-editor` displays layout and save status derived from these settings.
