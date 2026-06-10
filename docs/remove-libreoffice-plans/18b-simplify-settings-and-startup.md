# Plan 18B: Simplify Settings And Startup

## Goal

Remove LibreOffice/runtime settings and startup detection while keeping existing editor layout, autosave, conflict, and Markdown fallback settings.

## Implement

- Update `src/settings/interfaces.ts`:
  - remove `LibreNoteEditorActiveSource`
  - remove `desktop-odt`
  - remove `html-fallback` as a mode if it only exists to contrast with ODT
  - remove `libreOfficePath`
- Update `src/settings/constants.ts` defaults and dropdown options.
- Update `src/settings/helpers.ts` normalization so old saved values are accepted and migrated to the new defaults.
- Remove `src/settings/runtime/runtime.ts` imports from `src/main.ts`.
- Remove Office runtime state from `src/main.ts`.
- Stop registering `registerOpenDesktopOdtCommand`.
- Keep native Markdown fallback command registration.
- Update `src/mainTestHelpers.ts` so shared mocks no longer expose Office runtime or desktop conversion fixtures.

## Tests

- Update settings helper tests for old data migration.
- Update settings tab snapshots to remove LibreOffice path and Desktop ODT options.
- Update `src/mainRuntime.test.ts` or delete it if no runtime-specific startup behavior remains.
- Update main/plugin startup tests to expect no runtime detection or ODT command registration.

## Done When

- Plugin startup does not import or call office runtime detection.
- Settings UI does not mention LibreOffice, ODT, desktop source, or runtime.
- Old settings with `desktop-odt`, `html-fallback`, or `libreOfficePath` normalize safely.
