# Plan 09: Attachments Images And Tables

## Goal

Support vault attachments, image references, and table degradation without duplicating files or losing complex structure.

## Implement

- Add `src/attachments/`.
- Resolve image references through Obsidian metadata and vault-relative paths.
- Preserve alt text and captions where possible.
- Show broken attachment states.
- Add table import and export helpers.
- Export simple tables as markdown tables.
- Preserve complex tables as sanitized HTML blocks.
- Mark unsupported mobile table features read-only when needed.

## Tests

- Test image embed export as `![[image.png]]`.
- Test image paths remain vault-relative.
- Test renamed image references update through metadata where possible.
- Test missing image shows broken state.
- Test captions convert to nearby text when markdown cannot represent them.
- Test simple table markdown export.
- Test colspan and rowspan preserve as HTML fallback.
- Test complex desktop table is not destroyed by mobile open.

## MCP Verification

- Open notes with local images, missing images, captions, simple tables, and complex tables.
- Verify in MCP:
  - Existing image files are not duplicated.
  - Image embeds export back to Obsidian syntax.
  - Broken attachments are clearly shown.
  - Simple tables remain editable and export as markdown tables.
  - Complex tables remain visible and protected or HTML-backed.
  - Mobile-width viewport scrolls wide tables horizontally.

## Edge Cases

- Image file renamed outside the editor.
- Attachment path with spaces or nested folders.
- Duplicate image file names in different folders.
- Remote image URLs.
- Missing attachment.
- Empty table cells.
- Alignment markers in markdown tables.
- Escaped pipe characters.
- Colspan, rowspan, merged cells, captions, and nested content.

## Done When

- Attachments and tables degrade safely and preserve user data.
- All local checks pass.
