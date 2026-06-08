# Plan 16E: Link, Tag, Footnote, And Collapse Navigation

## Goal

Make navigation-oriented Markdown constructs behave like Obsidian inside the rich editor: tags, internal links, footnotes, and left-side collapse controls should navigate or fold without corrupting editable content.

## Implement

- Add a navigation interaction layer from `editor-view` into `html-editor` without using global state.
- Support internal link activation:
  - note links
  - heading links
  - block links
  - aliases
  - missing target warnings
- Support tag activation through Obsidian tag search/navigation behavior.
- Support external links through a safe open path and reject unsafe URL schemes.
- Add footnote reference and definition navigation inside the current editor surface.
- Add heading collapse controls on the left side:
  - generated from heading levels
  - keyboard accessible
  - fold all content until the next heading of the same or higher level
  - preserve hidden content in the DOM/source
- Keep collapse controls separate from generated Obsidian cleanup so imports do not depend on stale rendered controls.

## Tests

- Test `App` and `RibbonEditor` pass navigation callbacks without breaking existing props.
- Test internal link activation calls the editor-view navigation option with the preserved target.
- Test tags call the tag navigation option with exact tag text.
- Test unsafe external link schemes do not open.
- Test footnote reference navigation focuses or scrolls to the matching definition.
- Test heading collapse hides and shows the expected sibling blocks.
- Test collapse does not hide content past the next same-or-higher heading.
- Snapshot link, tag, footnote, and collapse-control rendering.

## MCP Verification

- Open a fixture note with:
  - internal links
  - heading links
  - block links
  - aliases
  - missing links
  - nested tags
  - external links
  - footnote references and definitions
  - multiple heading levels
- Verify:
  - links open/navigate like Obsidian
  - tags open tag search/navigation
  - footnotes jump between reference and definition
  - heading collapse controls appear on the left
  - collapsed content remains preserved after autosave and reload
  - link warnings still update when metadata changes

## Edge Cases

- Links inside protected content and code should not navigate accidentally.
- Missing notes, headings, blocks, and footnotes.
- Duplicate heading text.
- Duplicate footnote ids.
- External links with unsafe schemes.
- Tags containing nested path segments.
- Collapse across nested callouts, lists, tables, and embeds.
- Autosave while content is collapsed.
- Undo/redo after collapse or navigation interactions.

## Done When

- Tags, links, footnotes, and collapse controls match Obsidian behavior closely enough for normal Markdown workflows.
- Tests, format check, lint, typecheck, and Obsidian MCP verification pass.
