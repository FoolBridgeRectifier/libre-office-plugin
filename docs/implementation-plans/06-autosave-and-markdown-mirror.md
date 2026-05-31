# Plan 06: Autosave And Markdown Mirror

## Goal

Persist active HTML edits automatically and keep `.md` as the Obsidian compatibility mirror.

## Implement

- Add `src/autosave/`.
- Track dirty state from editor events.
- Save active rich source every 5 seconds by default.
- Sync markdown every 30 seconds by default.
- Save immediately on blur, note close, note switch, and plugin unload.
- Convert HTML back to markdown mirror.
- Keep frontmatter preserved above the generated markdown body.
- Add retry behavior for failed writes.
- Add status values: saved, saving, syncing markdown, error.

## Tests

- Use fake timers for autosave and markdown sync intervals.
- Test immediate saves on blur, close, switch, and unload.
- Test failed write retries.
- Test newer file checks prevent blind overwrite.
- Test frontmatter preservation during markdown mirror writes.
- Test exact markdown export for supported HTML.
- Test no save occurs when content is unchanged.

## MCP Verification

- Reload the plugin and open a test note.
- Type in the rich editor.
- Verify in MCP:
  - Status changes from dirty to saving to saved.
  - `.html` updates after autosave.
  - `.md` mirror updates after markdown sync.
  - Blur forces save before the interval.
  - Switching notes saves the previous note.
  - Plugin disable saves pending changes before unload.
  - Backlinks, graph, search, and tags see the updated `.md` mirror.

## Edge Cases

- Rapid typing across interval boundaries.
- Save while previous save is still in flight.
- Vault write failure.
- Read-only file or permission failure.
- External `.md` modification while editor is dirty.
- Closing Obsidian before sync interval.
- Multiple open views for the same note.
- Frontmatter-only notes.
- HTML content that cannot be represented exactly as markdown.

## Done When

- Manual save is not required for normal editing.
- Markdown mirror remains current enough for Obsidian features.
- All local checks pass.
