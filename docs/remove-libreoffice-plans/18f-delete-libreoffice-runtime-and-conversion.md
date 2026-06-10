# Plan 18F: Delete LibreOffice Runtime And Conversion

## Goal

Delete the now-unused runtime, ODT command, and ODT conversion code.

## Implement

- Delete `src/office-runtime/` after imports are gone.
- Delete `src/desktop-odt-command/` after command registration is gone.
- Delete ODT-specific conversion files:
  - `src/conversion/conversion.ts`
  - `src/conversion/helpers.ts` if only ODT code remains
  - `src/conversion/odt-input/`
  - `src/conversion/test-runtime/`
  - ODT validation and conversion tests
- Remove `src/conversion/index.ts` if sanitizer has moved and nothing remains.
- Remove ODT-specific constants and interfaces.
- Update imports and barrel exports.

## Tests

- Run `rg "office-runtime|desktop-odt|Desktop ODT|LibreOffice|odt|ODT|conversion" src`.
- Expected remaining hits should be only historical docs or intentionally retained migration comments.
- Run `npm run knip` after deletion.

## Done When

- No source module imports `office-runtime`, `desktop-odt-command`, or ODT conversion code.
- Deleted modules are not referenced by tests, barrels, or docs that describe current behavior.
- Knip does not report unresolved imports.
