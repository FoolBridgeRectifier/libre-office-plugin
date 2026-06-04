# Libre Note Editor Sequential Implementation Plans

Use these plans in order. Each plan is intentionally small enough to implement, test, and verify before starting the next one.

Before starting any plan:

- Re-read `CONVENTIONS.md` and `DESIGN.md`.
- Keep every feature folder within the required `primary file`, `constants.ts`, `interfaces.ts`, and `helpers.ts` structure.
- Keep each source file at or below 150 non-import lines.
- Use Tailwind utilities only for component styling.
- Add colocated tests for every changed behavior.

After every plan:

- Run the plan-specific tests.
- Run `npm run format:check`.
- Run `npm run lint`.
- Run `npm run typecheck`.
- If plugin behavior changed, verify Obsidian is running in debug mode on port `9222`, reload the plugin by disabling and enabling it, and complete the plan's MCP checks.

## Sequence

1. [Plan 01: Repair Baseline Ribbon Shell](./01-repair-baseline-ribbon-shell.md)
2. [Plan 02: Register Markdown Editor View](./02-register-markdown-editor-view.md)
3. [Plan 03: Rich Document Mapping Store](./03-rich-document-mapping-store.md)
4. [Plan 04: First Markdown Import To HTML](./04-first-markdown-import-to-html.md)
   4A. [Plan 04A: Obsidian Rendered HTML Markdown Import](./04a-obsidian-rendered-html-markdown-import.md)
5. [Plan 05: Local HTML Editor Source](./05-local-html-editor-source.md)
6. [Plan 06: Autosave And Markdown Mirror](./06-autosave-and-markdown-mirror.md)
7. [Plan 07: Obsidian Link Model](./07-obsidian-link-model.md)
8. [Plan 08: Structured Markdown Blocks](./08-structured-markdown-blocks.md)
9. [Plan 09: Attachments Images And Tables](./09-attachments-images-and-tables.md)
10. [Plan 10: Conflict Detection And Recovery](./10-conflict-detection-and-recovery.md)
11. [Plan 11: Desktop LibreOffice Runtime](./11-desktop-libreoffice-runtime.md)
12. [Plan 12: ODT Conversion Pipeline](./12-odt-conversion-pipeline.md)
13. [Plan 13: Settings And Status UI](./13-settings-and-status-ui.md)
14. [Plan 14: Mobile And Pageless Hardening](./14-mobile-and-pageless-hardening.md)
15. [Plan 15: Security And Release Acceptance](./15-security-and-release-acceptance.md)
