# Plan 16A: Editor Theme, Caret, And Margin

## Goal

Make the editable HTML surface visually match Obsidian in light and dark mode while adding the requested 8px editor margin, a darker Microsoft Word-like caret, no loaded-editor border, centered task checkbox controls, and non-editable callout icons.

## Implement

- Update `DESIGN.md` with editor-specific tokens before adding new styling:
  - editor surface background
  - editor text
  - editor muted text
  - editor border
  - editor caret for light and dark themes
  - editor selection where Obsidian tokens are available
- Add token aliases in `styles.css` only.
- Update `html-editor/constants.ts` class names to:
  - use editor tokens instead of ribbon body tokens for editable content
  - add an 8px margin around the editable surface
  - keep the loaded editor borderless while retaining error, warning, and empty-state borders
  - keep pageless mode full-width without a paper-white panel
  - keep page-width mode desktop-only
  - set `caret-color` through a token-backed Tailwind arbitrary property
- Ensure dark mode inherits Obsidian theme values so background and text invert correctly.
- Preserve rendered task checkbox inputs and make checkbox clicks toggle state.
- Style task checkbox controls with a centered, theme-aware checkmark that does not inherit oversized Obsidian preview dimensions.
- Render callout icons with Fluent UI icon assets so icons are visible, centered, theme-aware, and not editable note text.
- Hide preserved Obsidian `.callout-icon` markup when the pseudo-icon is active.
- Keep focus rings, media containment, table scrolling, and protected-block visibility.

## Tests

- Add `HtmlEditor` assertions for:
  - 8px margin class or token-backed spacing
  - token-backed editor background and text classes
  - token-backed caret color class
  - loaded editor does not include a visible border class
  - checked and unchecked task checkbox markup is preserved
  - checkbox toggles update `checked` and `data-task` without inserting a new block
  - callout pseudo-icon and hidden legacy icon CSS hooks are present
  - dark-mode compatible class or token surface
- Add snapshot coverage for light-mode and dark-mode shell/editor rendering.
- Add computed CSS assertions where JSDOM can resolve style from token declarations.

## MCP Verification

- Open Obsidian in debug mode and reload the plugin.
- Verify in light theme:
  - caret is darker and visible while typing
  - editor has an 8px margin
  - loaded editor has no visible border outline
  - text and editor surface match Obsidian reading/editing colors
  - checkbox click toggles the task state and does not create a new line
  - checkbox icon is centered in the square control
  - callout icon appears via CSS and is not editable text
- Switch to dark theme without closing the note.
- Verify:
  - editor background changes with the theme
  - text colors invert and remain readable
  - caret remains visible against dark background
  - selection, focus ring, tables, images, and protected blocks remain visible

## Edge Cases

- Custom Obsidian themes with missing tokens.
- High contrast themes.
- Focus inside inline code, callouts, tables, and links.
- Checked, unchecked, and toggled task list items.
- Nested callouts and unknown callout types.
- Page-width mode versus pageless mode.
- Split panes narrower than desktop width.
- Existing notes loaded before a theme switch.

## Done When

- Editor theme, text, caret, margin, borderless loaded surface, checkbox, and callout icon behavior match the requested visual baseline.
- Tests, format check, lint, typecheck, and Obsidian MCP verification pass.
