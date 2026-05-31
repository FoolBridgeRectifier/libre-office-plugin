# Plan 03: Rich Document Mapping Store

## Goal

Create the persistent mapping layer that connects each markdown file to stable rich document files.

## Implement

- Add `src/rich-documents/`.
- Define mapping interfaces with:
  - markdown path
  - stable rich document id
  - ODT path
  - HTML path
  - active source
  - sync timestamps
  - last editor platform
  - conflict state
- Store rich files under `.libre-note-editor/documents/`.
- Use stable ids that are not derived only from file names.
- Persist mappings through plugin data.
- Add helpers to create, read, update, rename, delete, archive, and recover mappings.
- Keep filesystem writes inside Obsidian vault APIs except for future LibreOffice-only operations.

## Tests

- Test stable id generation uniqueness.
- Test path creation stays inside `.libre-note-editor/documents/`.
- Test mapping creation for new notes.
- Test mapping lookup by markdown path and rich id.
- Test rename updates markdown path without changing rich id.
- Test delete archives rich paths instead of silently destroying them.
- Test missing plugin data recovery from rich document files.
- Test malformed plugin data is ignored or repaired safely.

## MCP Verification

- Reload the plugin in Obsidian through MCP.
- Open a new note, rename it, and delete a copy.
- Verify in MCP:
  - Plugin data contains one mapping per note.
  - Rename updates the mapping path and preserves the rich id.
  - Delete archives or marks rich files according to implementation.
  - Rich document paths are under `.libre-note-editor/documents/`.
  - No extra mappings are created by reopening the same note.

## Edge Cases

- Duplicate note names in different folders.
- Renames across folders.
- File names with spaces, Unicode, punctuation, and uppercase extensions.
- Missing `.libre-note-editor/documents/` folder.
- Corrupt JSON plugin data.
- Mapping points to missing rich files.
- Rich files exist but plugin data is missing.
- Two open leaves request mapping creation at the same time.

## Done When

- Mapping behavior is deterministic and recoverable.
- All local checks pass.
