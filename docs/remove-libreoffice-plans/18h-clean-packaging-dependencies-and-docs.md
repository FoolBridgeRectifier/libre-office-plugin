# Plan 18H: Clean Packaging Dependencies And Docs

## Goal

Remove runtime packaging assumptions and update project docs to match the HTML/Lexical core.

## Implement

- Update `scripts/bundle-plugin.mjs` so build no longer requires prepared runtime directories.
- Delete `scripts/prepare-runtime.mjs` and `scripts/runtime-pruning.mjs` if no longer used.
- Remove bundled LibreOffice payloads under `runtime/`.
- Keep only a placeholder if the repo still expects the folder, otherwise remove `runtime/` entirely.
- Update `package.json` scripts if runtime preparation is referenced.
- Update `package-lock.json` after dependency/package changes.
- Update `THIRD_PARTY_NOTICES.md` to remove LibreOffice notices if no LibreOffice payload remains.
- Update current-behavior docs:
  - `SYSTEM_DESIGN.md`
  - `src/README.md`
  - `src/html-editor/README.md`
  - `src/markdown-sync/README.md`
  - `src/rich-documents/README.md`
  - `src/editor-view/README.md`
  - `src/ribbon-editor/README.md`
  - `src/settings/README.md`
- Mark old implementation plans 11 and 12 obsolete or move them to an archive note.

## Tests

- Run `npm run build`.
- Run `npm run knip`.
- Search docs for stale current-tense mentions of LibreOffice, ODT, runtime, and desktop source.

## Done When

- Build output contains no bundled LibreOffice runtime.
- Current docs describe HTML plus Lexical as the core.
- Historical ODT docs are clearly obsolete or archived.
