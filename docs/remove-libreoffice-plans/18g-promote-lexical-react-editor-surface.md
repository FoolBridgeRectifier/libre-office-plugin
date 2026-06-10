# Plan 18G: Promote Lexical React Editor Surface

## Goal

Make the live editor use Lexical React rather than a hand-managed `contentEditable` wrapper with a Lexical-sounding name.

## Implement

- Add direct dependencies:
  - `@lexical/react`
  - keep `@lexical/html`
  - keep `lexical` for required core node classes/types/helpers
- Refactor `src/html-editor/lexical-source/LexicalSource.tsx` to compose:
  - `LexicalComposer`
  - `ContentEditable`
  - an HTML source load/export plugin
  - a protected-content guard plugin
  - navigation/callout/task/heading interaction plugins
- Recreate or restore `src/html-editor/lexical-source/plugins/` as the runtime plugin home if needed.
- Register custom nodes:
  - `HtmlElementNode`
  - `LockedHtmlNode`
  - later first-class rich nodes when toolbar commands are implemented
- Keep current HTML sanitization and source-preservation behavior unchanged.
- Keep direct `lexical` imports inside node/helper files only.

## Tests

- Update `HtmlEditor` tests to render through Lexical React.
- Keep existing Lexical HTML round-trip stress tests.
- Add a test that initial load does not mark the editor dirty.
- Add a test that user input emits sanitized HTML.
- Add a test that protected content blocks non-delete edits but can be removed.

## Done When

- The visible editor is actually Lexical React composed.
- `rg "contentEditable" src/html-editor/lexical-source` shows only Lexical React `ContentEditable` or intentional wrapper usage.
- Existing Markdown mirror export tests still pass.
