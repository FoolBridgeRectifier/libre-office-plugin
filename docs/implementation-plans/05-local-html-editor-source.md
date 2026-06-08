# Plan 05: Local HTML Editor Source

## Goal

Replace the placeholder editor surface with a bundled local browser editor that edits the `.html` rich source.

## Implement

- Add `src/html-editor/`.
- Choose the editor library after confirming license compatibility:
  - CKEditor 5 GPL only if project licensing accepts GPL.
  - Lexical if GPL is not acceptable.
- Bundle all editor code locally.
- Load the mapped HTML source into the editor.
- Emit dirty state from editor changes.
- Keep pageless responsive layout.
- Make source-preserved desktop-only content read-only and visible.

## Tests

- Component test editor load state, empty state, dirty state, and error state.
- Test editor change event updates HTML source state.
- Test source-preserved raw markdown cannot be accidentally edited as normal text.
- Test no remote assets are referenced.
- Snapshot the editor surface.

## MCP Verification

- Reload the plugin.
- Open a mapped note.
- Verify in MCP:
  - Editor loads existing `.html` content.
  - Typing marks the note dirty.
  - Editor works with network disabled or with no CDN requests.
  - Locked source-preserved content is visible and safe.
  - Mobile-width viewport remains usable.

## Edge Cases

- Missing `.html` file for an existing mapping.
- Corrupt HTML file.
- Huge HTML document.
- Unsupported tags from ODT or markdown conversion.
- Read-only locked source-preserved nodes.
- Editor initialization failure.
- Theme switch while editor is open.
- Multiple editor views open at once.

## Done When

- HTML rich editing works locally and can represent the imported note.
- All local checks pass.
