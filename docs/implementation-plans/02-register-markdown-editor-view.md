# Plan 02: Register Markdown Editor View

## Goal

Route opened markdown notes into a custom Libre Note Editor view while preserving the original `.md` files and restoring normal editing when the plugin unloads.

## Implement

- Add `src/editor-view/`.
- Move `ReactView` out of `src/main.ts` into `editor-view`.
- Register a markdown-capable view type for Libre Note Editor.
- Track the active `TFile` for each opened note.
- Open `.md` files in Libre Note Editor by default while the plugin is enabled.
- Preserve a safe fallback path to Obsidian's markdown view.
- On plugin unload, detach Libre views and restore markdown editing behavior.
- Do not add rich document creation yet.

## Tests

- Unit test view type constants and helper decisions.
- Mock Obsidian workspace APIs and assert:
  - View registration occurs on load.
  - Markdown leaves are routed only for `.md` files.
  - Non-markdown files are ignored.
  - Unload detaches only Libre view leaves.
  - Missing active file is handled without throwing.

## MCP Verification

- Confirm Obsidian MCP debug connection on port `9222`.
- Run `npm run dev`.
- Reload the plugin.
- Create or open a test `.md` note.
- Verify in MCP:
  - Opening a markdown note shows Libre Note Editor instead of raw markdown.
  - The note path displayed by the UI matches the opened file.
  - Opening non-markdown files still uses their normal Obsidian views.
  - Disabling the plugin restores raw markdown editing.
  - Re-enabling the plugin routes markdown again.

## Edge Cases

- Empty note.
- Untitled new note.
- File open before plugin load finishes.
- Multiple markdown leaves open.
- Split panes showing different notes.
- Workspace reload with persisted Libre leaves.
- Plugin disable while a Libre view is active.
- Mobile workspace where desktop-only APIs may be absent.

## Done When

- Markdown routing works live and can be fully reversed by disabling the plugin.
- All local checks pass.
