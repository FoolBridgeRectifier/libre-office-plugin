# Attachments Module

## What It Does

`attachments` preserves image embeds and table structures while Markdown is rendered into editable HTML and later exported back to the Markdown mirror.

The module keeps Obsidian attachment references vault-relative, marks broken or remote attachments, wraps wide tables for pageless editing, and protects complex tables that Markdown cannot represent safely.

Remote attachment fallbacks and complex table HTML use the shared `data-libre-protected` marker when the original source needs special handling. Remote fallbacks remain read-only and removable; complex tables stay editable and export from current sanitized table HTML.

## Main Components

- `index.ts` exposes attachment and table APIs used by Markdown import and HTML-to-Markdown export.
- `constants.ts` defines the `data-libre-*` attributes for attachment source, path, caption, status, table kind, and stored table HTML.
- `interfaces.ts` defines attachment status and the inline Markdown reader callback used by table export.
- `images/images.ts` annotates rendered image or embed elements with original Markdown source, target path, caption, and status.
- `images/utils.ts` parses Markdown image syntax and exports image/embed elements back to Markdown or Obsidian wiki embed syntax.
- `images/path-safety/pathSafety.ts` prevents generated attachment Markdown from using absolute paths, URL schemes, or parent traversal.
- `images/remote-attachments/remoteAttachments.ts` marks remote images as desktop-only protected content and removes live remote loading attributes.
- `tables/tables.ts` classifies tables, stores complex table HTML, and exports simple tables to Markdown table syntax.
- `tables/structure/structure.ts` identifies simple table geometry and wraps tables in horizontal scroll containers.
- `tables/sanitizer/sanitizer.ts` strips unsafe table HTML before complex table source is persisted.

## How It Is Used

`markdown-sync` calls `annotateAttachmentHtml` and `annotateTableHtml` after Obsidian renders Markdown. `autosave` calls `getAttachmentMarkdown` and `getTableMarkdown` while converting edited HTML back into the Markdown mirror. `html-editor` also reuses table wrapping so the editing surface remains responsive.
