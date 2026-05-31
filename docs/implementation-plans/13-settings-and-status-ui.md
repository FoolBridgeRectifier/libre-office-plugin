# Plan 13: Settings And Status UI

## Goal

Expose configuration and document status so users can control editing mode, intervals, conflict behavior, and fallbacks.

## Implement

- Add `src/settings/`.
- Add settings for:
  - LibreOffice path
  - autosave interval
  - markdown sync interval
  - conflict behavior
  - editor mode
  - markdown source fallback visibility
- Validate intervals before saving.
- Keep defaults:
  - autosave 5 seconds
  - markdown sync 30 seconds
  - pageless layout
  - automatic mode
- Add status UI to the editor surface.
- Use token-only colors and accessible labels.

## Tests

- Test default settings load.
- Test saved settings merge with new defaults.
- Test invalid intervals are rejected.
- Test editor mode changes affect active source selection.
- Test status labels for saved, saving, syncing markdown, conflict, and error.
- Snapshot settings and status UI.
- Add computed CSS assertions for dropdowns or modals if used.

## MCP Verification

- Reload the plugin and open settings.
- Verify in MCP:
  - Defaults are shown correctly.
  - Changing settings persists after plugin reload.
  - Invalid intervals show validation and do not save.
  - Mode changes alter active source behavior.
  - Status updates during save, sync, conflict, and error states.
  - Keyboard and screen-reader labels are present.

## Edge Cases

- Existing saved settings from older versions.
- Missing settings object.
- Negative, zero, fractional, or very large intervals.
- LibreOffice path cleared after being valid.
- Automatic mode on mobile.
- HTML fallback mode on desktop.
- Conflict behavior changed during an active conflict.
- Settings changed while note is saving.

## Done When

- Settings are reliable, validated, and reflected in live behavior.
- All local checks pass.
