# Plan 18D: Collapse Rich Document Model To HTML

## Goal

Make rich document persistence track Markdown and HTML only while still reading old ODT-bearing plugin data safely.

## Implement

- Update `src/rich-documents/interfaces.ts`:
  - `RichDocumentActiveSource` should be `markdown | html` or removed if no longer needed.
  - remove `odtPath`
  - remove `sourceStates.odt`
  - remove `syncTimestamps.odtSyncedAt`
  - remove conflict copy source `odt` for new writes.
- Update `src/rich-documents/constants.ts` to remove `RICH_DOCUMENT_ODT_FILE_NAME`.
- Update `src/rich-documents/paths/paths.ts` to create HTML and mapping paths only.
- Update `src/rich-documents/mapping/mapping.ts` to create HTML-only mappings.
- Update `src/rich-documents/plugin-data/**` normalizers:
  - accept old `activeSource: 'odt'` and normalize it to `html`
  - ignore old `odtPath`, `sourceStates.odt`, and `odtSyncedAt`
  - keep sidecar parsing resilient
- Update `src/rich-documents/vault/vault.ts` archive/recovery behavior so it does not expect ODT.

## Tests

- Update rich document mapping tests.
- Add migration tests for old ODT-bearing plugin data and sidecars.
- Update vault/archive tests.
- Run source-state and conflict tests after model changes.

## Done When

- New mappings contain Markdown path, HTML path, mapping path, and no ODT fields.
- Old ODT mappings load without throwing and write back as HTML-only mappings.
- No implementation code requires `mapping.odtPath`.
