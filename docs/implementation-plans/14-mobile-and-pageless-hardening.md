# Plan 14: Mobile And Pageless Hardening

## Goal

Make the HTML editor comfortable on mobile and enforce pageless behavior across supported rich content.

## Implement

- Harden responsive layout in `html-editor` and shared UI components.
- Default to pageless layout.
- Avoid fixed paper canvas on mobile.
- Ensure tables scroll horizontally.
- Ensure images resize to container width.
- Keep page layout features desktop-only.
- Add reduced-motion handling for editor UI transitions.

## Tests

- Test layout classes for pageless mode.
- Test images use container-safe sizing.
- Test tables use horizontal overflow behavior.
- Test desktop-only blocks remain visible and protected.
- Test reduced-motion class or behavior.
- Snapshot mobile-width rendering.

## MCP Verification

- Use MCP to emulate narrow and desktop viewports.
- Verify:
  - No horizontal page canvas is forced on mobile.
  - Text wraps without clipping.
  - Tables scroll horizontally inside the editor.
  - Images fit within the note width.
  - Commands remain reachable.
  - Desktop-only content is readable and protected.
  - Reduced-motion preference is respected.

## Edge Cases

- Very long unbroken words.
- Wide images.
- Wide tables with many columns.
- Nested lists in narrow panes.
- Split panes with narrow editor width.
- Touch selection and typing.
- Theme switch while in mobile width.
- Device rotation.

## Done When

- Mobile editing stays usable without requiring LibreOffice or fixed-page layout.
- All local checks pass.
