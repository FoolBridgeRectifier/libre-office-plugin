# Rich HTML Module

## What It Does

`rich-html` is a small adapter around rich HTML loading and initial autosave status detection.

It keeps view and command modules from needing to know the full `richDocumentWorkspace` load contract.

## Main Components

- `richHtml.ts` exposes `loadRichDocumentHtmlForStore`, which returns `null` unless a file and store are available, then delegates to `loadRichDocumentHtml`.
- `richHtml.ts` also exposes `getInitialRichDocumentAutosaveStatus`, which returns `conflicted` when the mapping has an unresolved conflict and `saved` otherwise.
- `index.ts` re-exports the public functions.

## How It Is Used

`editor-view/options` uses this module to load imported HTML and initialize autosave status before the React editor surface renders.
