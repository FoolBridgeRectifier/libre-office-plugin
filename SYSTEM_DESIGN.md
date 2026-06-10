# Libre Note Editor System Design

## Purpose

Libre Note Editor replaces Obsidian's Markdown editing surface with a local rich-note workflow while keeping the original Markdown note as the compatibility mirror for Obsidian search, links, backlinks, graph, and native fallback editing.

The current core is HTML plus Lexical. Markdown remains the Obsidian-facing mirror; the editable rich source is stored as sanitized HTML under `.libre-note-editor/documents/`.

## Source Model

Each Markdown note maps to one stable rich document:

- `Note.md` remains in the vault and acts as the Obsidian-facing mirror.
- `.libre-note-editor/documents/<rich-id>/document.html` is the local rich source.
- `.libre-note-editor/documents/<rich-id>/mapping.json` is a sidecar used to recover plugin mappings if persisted plugin data is missing.

`rich-documents` owns the mapping store. Mappings include the Markdown path, HTML path, lifecycle state, source snapshots, sync timestamps, conflict state, and compatibility metadata for old records. Rich ids are stable and sanitized so note renames do not move rich files.

## Runtime Components

- `main.ts` is the Obsidian plugin root. It loads settings, creates the rich-document store, registers the custom Markdown view, routes Markdown leaves, listens for vault rename/delete events, refreshes link warnings, and flushes/restores leaves on unload.
- `editor-view` is the Obsidian `FileView` boundary. It handles file lifecycle, routing state, autosave state, rich HTML loading, conflict resolution, and React rendering.
- `ribbon-editor` and `html-editor` are the visible React editing surface. The shell follows the OneNote-style ribbon structure from `DESIGN.md`.
- `html-editor/lexical-source` composes the Lexical React editor, imports sanitized HTML into Lexical nodes, protects source-preservation blocks, and exports sanitized HTML back to autosave.
- `settings` persists autosave, Markdown sync, conflict behavior, layout, and native fallback preferences.

## Import Flow

1. Obsidian opens a Markdown file.
2. `editor-view` routes the Markdown leaf to `libre-note-editor-view`.
3. `richDocumentWorkspace` gets or creates the note mapping.
4. `markdown-sync` imports the note only if `document.html` does not already exist.
5. Markdown frontmatter is split from the body, Obsidian renders the body when available, and source facts are collected for constructs that rendered HTML may lose.
6. Links, embeds, tags, attachments, tables, callouts, code, inline code, raw Markdown, and frontmatter are annotated or protected in HTML.
7. `html-sanitizer` cleans the imported HTML before it is written.
8. `rich-documents` snapshots Markdown and HTML source states and updates sync timestamps.

## Save And Sync Flow

HTML edits flow from `HtmlEditor` to `EditorView`, then into the `autosave` controller.

- HTML autosave writes `document.html` through `source-write`.
- Markdown sync converts the current rich HTML back into Markdown and writes `Note.md`.
- YAML frontmatter from the existing Markdown file is preserved.
- Obsidian links, embeds, tags, image references, simple tables, code blocks, callouts, block ids, and protected raw Markdown are exported from their preserved HTML annotations where possible.

Before any write, `source-write` compares current source snapshots with the mapping's stored snapshots. If Markdown or HTML changed independently, it creates a conflict instead of overwriting.

## Conflict Design

The conflict model is intentionally conservative.

- `conflicts/source-state` records existence and content hash for Markdown and HTML.
- `source-write` detects external edits, missing rich files, and multi-source changes before saving.
- `conflicts/copies` writes timestamped copies of every available source under `<rich-id>/conflicts/`.
- The mapping is marked `conflicted`, and autosave reports `conflicted`.
- `conflict-recovery` lets the user choose HTML, Markdown, or duplicate-copy behavior.
- `conflicts/resolution` writes the selected source, regenerates related sources when possible, updates sync timestamps, clears conflict state, and returns the resolved HTML to the view.

No conflict path silently discards a source version.

## Obsidian Compatibility

The Markdown mirror is the compatibility contract.

`obsidian-links`, `attachments`, and `markdown-sync` preserve source-level details that Obsidian's rendered HTML cannot fully represent. Original wiki links, embeds, tags, block ids, Markdown image syntax, callouts, code fences, inline code, comments, raw HTML, and complex table source are stored on protected templates or `data-libre-*` attributes.

Protected content is the durable preservation mechanism for source that must round-trip exactly or needs special export handling. The serialized marker is `data-libre-protected`. Code fences and complex tables remain editable and removable, and export uses their current DOM rather than stale preserved source attributes. Read-only protected content, such as frontmatter templates, source-facts templates, raw Markdown fallbacks, and remote media fallbacks, gets temporary render-time guards such as `data-libre-editor-protected`, `contenteditable="false"`, and `libre-protected-html-block`; those guards are stripped before saving HTML, and delete operations remain possible.

`editor-view/link-warnings` refreshes warning counts when Obsidian metadata changes so missing heading and block targets stay visible in the UI.

## Security And Safety

The system is local-only and avoids remote execution.

- HTML import and editor reads remove scripts, executable attributes, unsafe style values, and remote-loading elements.
- Remote images are protected instead of fetched or made directly editable.
- Hidden rich-document paths are validated to stay inside `.libre-note-editor/documents/`.
- Attachment paths reject absolute paths, URL schemes, and parent traversal unless explicitly handling a protected remote image source.

## UX Design

The UI follows `DESIGN.md`:

- OneNote structure: tabs, ribbon command groups, large/compact command buttons, uppercase group labels, and status-heavy editing flow.
- Obsidian skin: theme tokens, host typography, compact panel depth, focus rings, dark-mode token behavior, and Tailwind utilities.
- Pageless layout is the default, with a page-width option.
- Status is always visible: save state, layout, link warnings, and active Markdown file.
