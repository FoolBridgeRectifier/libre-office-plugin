# Plan 04: First Markdown Import To HTML

## Goal

On first open, convert the markdown body into a local HTML rich source while preserving frontmatter and unsupported markdown safely.

## Implement

- Add `src/markdown-sync/`.
- Split frontmatter from markdown body without reordering keys.
- Convert supported markdown into sanitized HTML.
- Represent Obsidian-specific syntax with protected markers for later rich nodes.
- Preserve unknown markdown as protected raw blocks.
- Write the initial `.html` file for the mapping.
- Set active source to HTML on mobile or HTML fallback mode.
- Leave ODT generation for a later plan.

## Tests

- Test frontmatter extraction:
  - no frontmatter
  - valid frontmatter
  - invalid frontmatter
  - body beginning with `---` that is not frontmatter
- Test markdown to HTML for headings, paragraphs, emphasis, lists, links, tags, embeds, code, callouts, and tables.
- Test dangerous HTML is sanitized.
- Test unknown markdown round-trips as protected raw blocks.
- Test first import is idempotent and does not rewrite an existing richer source unnecessarily.

## MCP Verification

- Reload the plugin.
- Open notes containing frontmatter, headings, wiki links, callouts, code blocks, tables, embeds, tags, and unsupported markdown.
- Verify in MCP:
  - `.html` files are created under the mapped document folder.
  - Frontmatter is not shown as normal rich text.
  - The rendered editor surface shows readable content.
  - Dangerous HTML does not execute.
  - Reopening the note does not duplicate or re-import content.

## Edge Cases

- Empty markdown file.
- File containing only frontmatter.
- Invalid YAML frontmatter.
- Nested callouts.
- Fenced code containing markdown-looking syntax.
- Inline HTML with scripts or event handlers.
- Wiki links with aliases, headings, and block ids.
- Broken or unresolved embeds.
- Very large note.
- Markdown modified outside plugin between mapping creation and import.

## Done When

- First open creates a safe local HTML source and preserves markdown compatibility data.
- All local checks pass.
