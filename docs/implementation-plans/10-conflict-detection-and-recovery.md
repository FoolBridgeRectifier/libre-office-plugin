# Plan 10: Conflict Detection And Recovery

## Goal

Detect external changes across `.md`, `.html`, and `.odt`, and preserve all versions when safe synchronization is impossible.

## Implement

- Add `src/conflicts/`.
- Track modified times and sync hashes for markdown, HTML, and ODT.
- Determine when one source can safely sync forward.
- Create conflicts when two or more sources changed independently.
- Create timestamped conflict copies.
- Add conflict state to mapping data.
- Add user choices:
  - keep desktop version
  - keep mobile version
  - keep markdown version
  - duplicate conflict copy
- Never auto-merge rich conflicts in v1.

## Tests

- Test hash changes for each source independently.
- Test one-source changes sync forward.
- Test two-source changes create conflict.
- Test conflict filenames are stable and timestamped.
- Test conflict resolution updates mapping and clears state.
- Test no source is deleted during conflict creation.
- Test stale timestamps with unchanged content do not create false conflicts.

## MCP Verification

- Open a note, edit rich HTML, then externally edit `.md`.
- Verify in MCP:
  - Conflict status appears.
  - Conflict copies are created.
  - User choice keeps the selected source.
  - Unselected versions remain available.
  - Markdown mirror is not overwritten while conflict is unresolved.
  - Reopening the note preserves conflict state.

## Edge Cases

- Clock skew or same millisecond writes.
- Hash mismatch with identical modified time.
- Modified time changes but content hash is same.
- External delete of one source.
- Missing conflict directory.
- Multiple conflict rounds for same note.
- Conflicts in two open panes.
- Plugin unload during conflict copy creation.

## Done When

- Conflicts never discard data silently.
- All local checks pass.
