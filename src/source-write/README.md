# Source Write Module

## What It Does

`source-write` persists edited HTML and regenerates the Markdown mirror while protecting against external source changes.

It is the write-side safety layer between autosave and vault persistence.

## Main Components

- `sourceWrite.ts` implements `saveRichDocumentHtml` and `syncMarkdownMirror`.
- `helpers.ts` computes conflict source lists, detects independent Markdown/HTML changes, checks rich-source drift, detects external HTML edits, and updates Markdown sync timestamps.
- `index.ts` re-exports the public write functions.

## How It Is Used

`autosave` calls `saveRichDocumentHtml` for frequent HTML writes and `syncMarkdownMirror` for periodic Markdown regeneration. Both functions sanitize HTML, compare source states through `conflicts`, create conflict copies when needed, and update the `rich-documents` mapping when writes succeed.
