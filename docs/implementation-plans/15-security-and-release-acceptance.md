# Plan 15: Security And Release Acceptance

## Goal

Harden the implementation and verify the full v1 acceptance criteria end to end.

## Implement

- Review all import and conversion paths for local-only behavior.
- Sanitize all imported and converted HTML.
- Strip scripts and inline event handlers.
- Block remote code execution.
- Do not load remote editor assets.
- Validate all generated paths stay inside the vault or rich document folder.
- Ensure macros are ignored and never executed.
- Add final user-facing error states for unsafe content, missing runtime, and conflicts.

## Tests

- Test script tags are stripped.
- Test inline event handlers are stripped.
- Test dangerous URLs are rejected or neutralized.
- Test generated paths cannot escape `.libre-note-editor/documents/`.
- Test remote editor assets are not requested.
- Test macros are not executed.
- Test plugin load, first import, autosave, markdown sync, conflict, settings, mobile fallback, and desktop conversion flows.
- Run the full suite.

## MCP Verification

- Complete an end-to-end pass in Obsidian:
  - Plugin loads.
  - `.md` opens rich view.
  - Markdown source is hidden by default.
  - Disabling plugin restores markdown editing.
  - First import creates `.html`.
  - Desktop import creates `.odt` when LibreOffice is available.
  - Autosave and markdown sync work.
  - Obsidian backlinks, graph, tags, heading links, and search work from `.md`.
  - Mobile or narrow-width HTML fallback works.
  - Conflict copies preserve all versions.
  - Unsupported features degrade safely.
  - No console errors appear during normal flows.

## Edge Cases

- Malicious HTML.
- Remote image URLs.
- Path traversal attempts in mappings or attachment references.
- Corrupt plugin data.
- Missing rich files.
- External file edits during save.
- Plugin disabled during save or conversion.
- Obsidian restart with dirty or conflicted notes.
- Offline operation with network blocked.
- Large notes and many open panes.

## Done When

- All acceptance criteria from `docs/initial.md` are verified.
- `npm test`, `npm run format:check`, `npm run lint`, `npm run typecheck`, and `npm run build` pass.
- Live Obsidian MCP verification is complete.
