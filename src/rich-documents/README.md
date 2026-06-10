# Rich Documents Module

## What It Does

`rich-documents` stores the relationship between a Markdown note and its hidden rich sources.

Each mapping keeps a stable rich-document id, Markdown path, HTML path, source snapshots, sync timestamps, conflict state, and lifecycle state. Paths are rooted under `.libre-note-editor/documents/` and are generated from the stable rich id rather than the note filename.

## Main Components

- `richDocuments.ts` implements `createRichDocumentStore`, an exclusive-operation mapping store backed by Obsidian plugin data and sidecar files.
- `interfaces.ts` defines mappings, file paths, plugin data, store contracts, source states, sync timestamps, vault adapter shape, conflict state, and lifecycle values.
- `constants.ts` defines plugin data version, rich id prefix, hidden document root, rich source filenames, mapping sidecar filename, and archive folder name.
- `mapping/mapping.ts` creates active and archived mapping records plus stable rich-document ids.
- `paths/paths.ts` sanitizes ids, creates rich-document paths, builds archive file paths, and verifies paths stay inside the hidden root.
- `plugin-data/pluginData.ts` normalizes unknown plugin data, repairs unsafe paths from rich ids, serializes/parses sidecars, and normalizes sync timestamps.
- `plugin-data/conflict/conflict.ts` normalizes persisted conflict state and conflict copies.
- `plugin-data/source-states/sourceStates.ts` normalizes persisted source snapshot state.
- `vault/vault.ts` creates vault folders, persists mapping sidecars, recovers mappings from sidecars, and archives rich files.
- `utils.ts` contains in-memory store and vault helpers for tests.

## How It Is Used

`main.ts` creates one store on plugin load. `richDocumentWorkspace`, `markdown-sync`, `source-write`, and `conflicts` use the store to create mappings, persist sync state, archive deleted notes, and recover from missing plugin data.
