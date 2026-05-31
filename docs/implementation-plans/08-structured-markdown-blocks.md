# Plan 08: Structured Markdown Blocks

## Goal

Round-trip frontmatter, callouts, code blocks, and other structured markdown without accidental formatting or data loss.

## Implement

- Extend `markdown-sync` with dedicated block models.
- Preserve frontmatter as hidden metadata for v1.
- Render callouts as rich blocks.
- Render fenced code blocks as non-rich-editing code regions.
- Preserve inline code as inline code.
- Keep unsupported markdown in protected raw blocks.

## Tests

- Test frontmatter never reorders or deletes keys.
- Test invalid frontmatter remains raw and visible only as needed.
- Test callout type, title, collapsed state, and nested content.
- Test unknown callout types export valid Obsidian callout syntax.
- Test fenced code language and code text are exact.
- Test inline code export is exact.
- Test protected raw blocks survive import, edit nearby, and export.

## MCP Verification

- Open structured markdown fixture notes.
- Verify in MCP:
  - Frontmatter is hidden from normal rich text.
  - Callouts render as recognizable blocks.
  - Collapsed callout state is preserved.
  - Code blocks do not accept rich formatting.
  - Markdown sync exports exact callout and code syntax.
  - Unsupported markdown is protected and not silently dropped.

## Edge Cases

- Nested callouts with lists.
- Code fences containing triple backticks.
- Code blocks with no language.
- Invalid frontmatter delimiter.
- Empty callout title.
- Collapsed callout with nested blocks.
- Raw blocks at start or end of document.
- Markdown syntax inside code or raw blocks.

## Done When

- Structured markdown can be edited around safely and exported back predictably.
- All local checks pass.
