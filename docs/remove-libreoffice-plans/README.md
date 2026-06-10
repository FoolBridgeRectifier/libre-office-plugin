# Remove LibreOffice Plans

## Goal

Remove LibreOffice and ODT from the core editor while keeping rich HTML editing, Markdown mirror sync, Obsidian compatibility, and OneNote-style UI.

## Required Reading

- `CONVENTIONS.md`
- `DESIGN.md`
- `docs/remove-libreoffice-change-inventory.md`
- `SYSTEM_DESIGN.md`

## Sequence

1. [Plan 18A: Extract HTML Sanitizer](./18a-extract-html-sanitizer.md)
2. [Plan 18B: Simplify Settings And Startup](./18b-simplify-settings-and-startup.md)
3. [Plan 18C: Remove Desktop ODT Lifecycle](./18c-remove-desktop-odt-lifecycle.md)
4. [Plan 18D: Collapse Rich Document Model To HTML](./18d-collapse-rich-document-model-to-html.md)
5. [Plan 18E: Simplify Conflict Recovery](./18e-simplify-conflict-recovery.md)
6. [Plan 18F: Delete LibreOffice Runtime And Conversion](./18f-delete-libreoffice-runtime-and-conversion.md)
7. [Plan 18G: Promote Lexical React Editor Surface](./18g-promote-lexical-react-editor-surface.md)
8. [Plan 18H: Clean Packaging Dependencies And Docs](./18h-clean-packaging-dependencies-and-docs.md)
9. [Plan 18I: Final Regression And Obsidian Verification](./18i-final-regression-and-obsidian-verification.md)

## Cross-Cutting Rules

- Do not delete user `.odt` files automatically in the first removal pass.
- Keep old plugin data readable while writing only the new HTML-only shape.
- Keep Markdown mirror behavior unchanged unless a test proves the current behavior is wrong.
- Prefer `@lexical/react` for the editor surface.
- Keep direct `lexical` imports only for custom node classes, node helpers, editor types, and tests that need `createEditor`.
- Run focused tests after each plan, then format, lint, typecheck, knip, and build before final acceptance.

## Done When

- The plugin works without a bundled runtime directory.
- There is no user-facing LibreOffice, ODT, desktop source, or runtime status.
- Rich HTML and Markdown mirror workflows still pass the existing parity tests.
- The live editor is composed with Lexical React or the remaining gap is explicitly documented.
