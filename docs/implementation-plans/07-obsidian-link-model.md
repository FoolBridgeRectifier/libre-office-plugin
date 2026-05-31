# Plan 07: Obsidian Link Model

## Goal

Preserve Obsidian links, embeds, tags, headings, and block ids through rich editing and markdown sync.

## Implement

- Add `src/obsidian-links/`.
- Model wiki links as custom rich nodes or protected inline tokens.
- Support note links, heading links, aliases, heading aliases, block links, embeds, image embeds, and tags.
- Generate heading anchors from visible heading text.
- Preserve duplicate heading behavior as closely as Obsidian allows.
- Warn when a heading target was renamed and cannot be resolved.

## Tests

- Test import and export for:
  - `[[Note]]`
  - `[[Note#Heading]]`
  - `[[Note|Alias]]`
  - `[[Note#Heading|Alias]]`
  - `[[Note#^block-id]]`
  - `![[File.png]]`
  - `![[Note]]`
  - `#tag` and `#parent/child`
  - `^block-id`
- Test duplicate headings and case preservation.
- Test empty headings become paragraphs.
- Test link text edits update alias but not target unless explicitly changed.

## MCP Verification

- Open a note with each link form.
- Verify in MCP:
  - Rich editor displays links and embeds as recognizable nodes.
  - Editing nearby text does not corrupt link tokens.
  - Markdown mirror exports exact Obsidian syntax.
  - Backlinks update in Obsidian.
  - Graph links remain connected.
  - Heading and block links navigate after sync.

## Edge Cases

- Links with spaces and punctuation.
- Links to missing notes.
- Aliases containing pipe-like text.
- Headings with duplicate names.
- Renamed headings.
- Empty heading text.
- Block ids next to rich content.
- Tags in code blocks should not become tag nodes.
- Escaped hash characters should not become tags.

## Done When

- Obsidian's link contract survives rich editing.
- All local checks pass.
