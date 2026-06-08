# Plan 16D: Callout Design And Folding Parity

## Goal

Make callouts visually match Obsidian callouts and support left-side folding without losing callout source, type, title, or nested content.

## Implement

- Preserve the Obsidian callout DOM shape already emitted by `markdown-sync`.
- Add token-backed callout styling for:
  - title row
  - icon area
  - fold button on the left side
  - body content
  - known callout types
  - unknown custom callout types
  - dark mode
- Add a callout folding interaction that:
  - reads `data-callout-fold`
  - toggles folded/unfolded visual state
  - updates `data-callout-fold` so export preserves state
  - hides content without deleting it
  - remains keyboard accessible
- Keep nested callouts independently foldable.
- Preserve source when a callout is unchanged; export valid Obsidian callout syntax after supported edits.

## Tests

- Test known and unknown callout type classes/data attributes render.
- Test folded and unfolded callout states.
- Test clicking the left fold control hides and shows content.
- Test keyboard activation toggles folding.
- Test nested callouts toggle independently.
- Test Markdown mirror preserves `+` and `-` fold markers.
- Snapshot callouts in light and dark compatible states.

## MCP Verification

- Open a fixture note with:
  - every common callout type
  - custom callout type
  - empty title
  - folded callout
  - nested callout
  - lists, links, embeds, and code inside callouts
- Verify callouts match Obsidian visual design.
- Toggle fold controls using mouse and keyboard.
- Verify Markdown sync preserves callout type, title, fold state, and body.

## Edge Cases

- Empty callout title.
- Unknown callout type.
- Nested callouts with same type.
- Folded callout containing images or tables.
- Callout with no content body.
- Deleted callout title.
- External Markdown edit changing fold state.

## Done When

- Callouts look and fold like Obsidian callouts and preserve source safely.
- Tests, format check, lint, typecheck, and Obsidian MCP verification pass.
