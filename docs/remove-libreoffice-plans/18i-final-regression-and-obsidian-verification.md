# Plan 18I: Final Regression And Obsidian Verification

## Goal

Prove the plugin works as an HTML/Lexical rich Markdown editor after LibreOffice removal.

## Implement

- Add or update acceptance fixtures for:
  - first Markdown import
  - existing HTML source load
  - autosave
  - Markdown mirror sync
  - conflict recovery
  - old ODT-bearing mapping migration
  - links, tags, callouts, tasks, code fences, tables, images, and protected raw Markdown
- Remove tests that only prove LibreOffice runtime or ODT conversion behavior.
- Add a final source search checklist to the release notes or docs.

## Tests

- Run `npm test`.
- Run `npm run format:check`.
- Run `npm run lint`.
- Run `npm run typecheck`.
- Run `npm run knip`.
- Run `npm run build`.

## MCP Verification

- Verify Obsidian is running in debug mode on port `9222`.
- Reload the plugin by disabling and enabling it.
- Open a Markdown note with no existing rich HTML and verify first import.
- Edit rich HTML and verify autosave.
- Verify Markdown mirror content in native Markdown fallback.
- Verify no LibreOffice setup/status/ODT commands appear.
- Verify old mappings with ODT fields still open through HTML.

## Done When

- Local checks pass.
- Obsidian MCP verification passes.
- No current product path requires LibreOffice, ODT, bundled runtime payloads, or desktop source sync.
