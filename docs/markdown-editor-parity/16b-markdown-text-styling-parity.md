# Plan 16B: Markdown Text Styling Parity

## Goal

Make rendered rich text match Obsidian Markdown styling for common Markdown tags before adding deeper interactive behavior.

## Implement

- Add editor-surface utilities for Markdown content inside `.libre-html-editor`.
- Style these constructs with Obsidian-compatible tokens:
  - paragraphs
  - headings `h1` through `h6`
  - bold, italic, strikethrough, highlight
  - inline code
  - code fences
  - blockquotes
  - ordered, unordered, and nested lists
  - horizontal rules
  - tables and table headers
  - protected raw Markdown blocks
- Preserve existing responsive image and table behavior.
- Keep Markdown-specific styling scoped to the Libre editor so it does not leak into Obsidian host UI.
- Add fallback styling for `mark`, `del`, and `s` export paths if autosave does not already handle them.

## Tests

- Add `HtmlEditor` rendering tests for the styled constructs.
- Assert exact classes or wrapper behavior for:
  - headings
  - inline code
  - code fences
  - blockquotes
  - highlights
  - tables
- Add autosave Markdown mirror tests for any newly supported export paths.
- Snapshot mixed Markdown content in the editor.

## MCP Verification

- Open a fixture note containing all styled constructs.
- Verify in light and dark themes:
  - text contrast is WCAG AA
  - headings resemble Obsidian Markdown headings
  - inline code and code fences are readable
  - highlights remain visible without washing out text
  - tables and quotes match Obsidian spacing and color behavior

## Edge Cases

- Nested inline marks.
- Empty headings and paragraphs.
- Escaped Markdown characters.
- Long code lines.
- Highlighted links and inline code.
- Tables in narrow panes.
- Protected blocks next to editable text.

## Done When

- Common Markdown text constructs visually match Obsidian and still export safely.
- Tests, format check, lint, typecheck, and Obsidian MCP verification pass.
