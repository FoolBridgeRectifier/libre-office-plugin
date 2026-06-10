# Plan 18A: Extract HTML Sanitizer

## Goal

Move HTML sanitization out of `conversion` so ODT conversion code can be deleted later without breaking Markdown import, source writes, or the HTML editor.

## Implement

- Create a new sanitizer-focused module, such as `src/html-sanitizer/`.
- Move or re-export the current sanitizer API:
  - `sanitizeConvertedHtmlSource`
  - `sanitizeConvertedHtmlSourceWithReport`
  - `sanitizeHtmlFragmentSourceWithReport`
- Rename functions only if the call sites can be updated cleanly in this plan.
- Update imports in:
  - `src/markdown-sync/markdownSync.ts`
  - `src/source-write/sourceWrite.ts`
  - `src/html-editor/lexical-source/source-html/sourceHtml.ts`
  - attachment/table or conversion-adjacent tests that only need sanitizer behavior
- Keep ODT conversion imports working until later plans remove them.

## Tests

- Run sanitizer tests after moving them.
- Run `src/markdown-sync` import tests.
- Run `src/source-write` tests.
- Run `src/html-editor` sanitizer/protected-content tests.

## Done When

- No non-ODT module imports sanitizer from `src/conversion`.
- Sanitizer behavior is unchanged.
- Format, lint, typecheck, and focused tests pass.
