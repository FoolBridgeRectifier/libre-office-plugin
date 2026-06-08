# Autosave Module

## What It Does

`autosave` schedules HTML source saves, Markdown mirror syncs, retries, and status changes for the active editor document.

It treats HTML saves and Markdown syncs as separate operations: HTML is saved frequently, while Markdown is regenerated less often as Obsidian's compatibility contract.

## Main Components

- `autosave.ts` implements `createAutosaveController`, which tracks the active document, pending HTML, last saved HTML, timers, in-flight saves, retry scheduling, and status transitions.
- `interfaces.ts` defines controller methods, document shape, save/sync request contracts, timer handle type, and the `AutosaveStatus` union used by the UI.
- `constants.ts` sets default intervals: 5 seconds for HTML autosave, 30 seconds for Markdown sync, and 1 second for retry.
- `helpers.ts` clears timers, resolves timing defaults, detects conflict errors, and creates the final Markdown mirror source while preserving YAML frontmatter.
- `markdown/markdown.ts` converts editor HTML back into Markdown blocks and inline Markdown.
- `markdown/utils.ts` contains code block and list export helpers.

## How It Is Used

`editor-view` creates one autosave controller per custom view. HTML input events call `handleHtmlSourceChange`; blur, source switching, note close, and plugin unload call `flushHtml` or `flushAll`. The controller delegates actual persistence to `source-write`.
