# Settings Module

## What It Does

`settings` owns persisted plugin settings, the Obsidian settings tab, active-source selection, interval validation, and runtime detection wiring.

Settings decide whether the editor uses automatic mode, desktop ODT mode, or HTML fallback mode; they also control autosave intervals, markdown sync interval, conflict behavior preference, page layout, LibreOffice path display, and native Markdown fallback visibility.

## Main Components

- `Settings.ts` defines `LibreNoteEditorSettingsTab`, the Obsidian settings UI.
- `helpers.ts` loads, normalizes, saves, validates, and applies settings. It also resolves the active editor source from settings plus runtime/platform environment and refreshes open editor views after settings changes.
- `interfaces.ts` defines settings unions, persisted settings shape, source environment, settings plugin contract, and interval validation result.
- `constants.ts` defines defaults, interval bounds, and dropdown options.
- `dropdown/dropdown.ts` adds typed Obsidian dropdown settings.
- `runtime/runtime.ts` bridges Obsidian `Platform`, plugin manifest path, vault adapter, and `office-runtime` detection.
- `index.ts` re-exports the public settings APIs.

## How It Is Used

`main.ts` loads settings during plugin startup, registers the settings tab, saves user changes through `saveSettings`, and passes settings accessors into `editor-view/options`. `ribbon-editor` displays mode, layout, active source, and runtime status derived from these settings.
