# Source Module

## What It Does

`src` contains the Obsidian plugin entrypoint, the React application boundary, workspace integration helpers, and feature modules for rich-document storage, import, editing, syncing, conversion, conflict handling, settings, and UI.

The code is organized around one Obsidian custom view for Markdown files. The original `.md` note remains the compatibility mirror, while hidden rich-document files under `.libre-note-editor/documents/` hold the editable HTML and ODT sources.

## Main Components

- `main.ts` defines `LibreNoteEditorPlugin`, the Obsidian `Plugin` subclass. It loads settings, detects LibreOffice, creates the rich-document store, registers the custom Markdown view, commands, vault events, metadata refresh events, and unload cleanup.
- `App.tsx` is the React app boundary rendered by `editor-view`. It passes workspace state into `ribbon-editor`.
- `interfaces.ts` holds root contracts shared by the plugin entrypoint, source writing, rich-document loading, and React app props.
- `richDocumentWorkspace.ts` coordinates cross-module workspace flows: mapping event registration, first HTML load/import, open editor flushing, HTML save export, markdown mirror sync, and conflict resolution re-exports.
- `testFileHelpers.ts`, `markdownSyncTestHelpers.ts`, and `main*TestHelpers.ts` are shared test fixtures for mocked Obsidian files, workspaces, metadata cache, settings APIs, and rich-document stores.

## How It Is Used

Obsidian loads `main.ts`, which registers Libre Note Editor as the handler for Markdown leaves. When a note opens, `editor-view` asks `rich-html` and `richDocumentWorkspace` to load or create the rich HTML source, then renders `App`. User edits flow back through `source-write`, `autosave`, and `markdown-sync` so the Markdown mirror stays useful for Obsidian links, search, backlinks, and graph behavior.
