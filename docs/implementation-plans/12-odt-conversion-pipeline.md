# Plan 12: ODT Conversion Pipeline

> Obsolete historical plan. Libre Note Editor no longer creates, opens, or
> synchronizes ODT files. The active architecture is the HTML/Lexical core
> described in `SYSTEM_DESIGN.md`.

## Goal

Add local ODT creation and conversion so desktop edits use `.odt` as the rich source while keeping HTML and markdown mirrors synchronized.

## Implement

- Add `src/conversion/`.
- Convert imported HTML to ODT on desktop first open.
- Open or launch the plugin-bundled LibreOffice runtime for `.odt` editing.
- Detect ODT save events through explicit file state checks.
- After desktop save:
  - convert ODT to HTML
  - sanitize generated HTML
  - convert HTML to markdown mirror
- Mark unsupported mobile formatting as desktop-only.
- Ignore macros and never execute embedded scripts.

## Tests

- Mock conversion command construction.
- Test generated paths remain inside the rich document folder.
- Test ODT save detection.
- Test ODT to HTML to markdown sequence.
- Test conversion failure leaves previous valid sources intact.
- Test desktop-only content is preserved in ODT and protected in HTML.
- Test macros and scripts are never executed.

## MCP Verification

- With bundled LibreOffice present in the plugin `runtime/` folder, open a desktop note.
- Verify in MCP:
  - First desktop import creates `.odt`.
  - Opening desktop mode launches or focuses local LibreOffice as expected.
  - Saving ODT updates `.html`.
  - Markdown mirror updates after conversion.
  - Unsupported mobile formatting is marked desktop-only.
  - Conversion errors show status and do not destroy previous sources.

## Edge Cases

- Bundled LibreOffice missing after mapping says desktop mode.
- ODT locked by another process.
- Conversion timeout.
- Corrupt ODT.
- ODT changed externally while HTML editor is dirty.
- Complex formatting unsupported by HTML.
- Page breaks, headers, footers, comments, and track changes.
- Remote images in converted HTML.

## Done When

- Desktop rich source can synchronize through local conversion without data loss.
- All local checks pass.
