# Editor View Module

## What It Does

`editor-view` owns the Obsidian custom Markdown view. It routes Markdown leaves into Libre Note Editor, manages file lifecycle, loads rich HTML, wires autosave and conflict handling, refreshes link warnings, and renders the React app.

This module is the main boundary between Obsidian workspace events and React UI state.

## Main Components

- `EditorView.tsx` defines the `FileView` subclass for `libre-note-editor-view`. It implements Obsidian lifecycle hooks, view state, file load/unload, rename handling, autosave flushing, link warning refresh, conflict resolution, and React rendering.
- `helpers.ts` creates Libre/native view states, registers the custom view, routes Markdown leaves, opens native fallback leaves, and decides which files are handled.
- `interfaces.ts` defines editor view options, render target state, loaded state, source targets, and registration contracts.
- `constants.ts` defines view types, native fallback command ids/names, and supported Markdown extension values.
- `app-element/appElement.ts` creates the React root and translates `EditorView` state into `App` props.
- `autosave-controller/autosaveController.ts` adapts `EditorViewOptions` persistence callbacks to the generic `autosave` controller.
- `conflict/conflict.ts` runs conflict resolution and applies the resolved HTML/status back to the view.
- `link-warnings/linkWarnings.ts` refreshes open editor views when Obsidian metadata changes.
- `options/options.ts` builds production `EditorViewOptions` from Obsidian app, settings, rich-document store, link resolver, and source-write modules.
- `state/state.ts` contains pure state transitions for loading, unloading, HTML changes, settings refresh, autosave document binding, and link warning counts.
- `unload/unload.ts` restores Libre Markdown leaves to Obsidian's native Markdown view on plugin unload.

## How It Is Used

`main.ts` registers this view and routes Markdown leaves to it. `EditorView` then uses `rich-html`, `markdown-sync`, `source-write`, `conflicts`, `settings`, and `obsidian-links` through the option callbacks created in `options/options.ts`.
