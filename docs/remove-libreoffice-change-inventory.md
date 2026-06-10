# Remove LibreOffice Change Inventory

## Goal

Remove LibreOffice and ODT as core product/runtime concerns. Keep the product as an Obsidian-native rich Markdown editor backed by rich HTML, Markdown mirror sync, source preservation, and a Lexical React editing surface.

## Target Architecture

```text
Markdown note
  <-> Markdown mirror sync
Rich HTML source under .libre-note-editor/documents/<rich-id>/document.html
  <-> Lexical React editor surface
```

ODT, LibreOffice runtime detection, bundled runtime packaging, desktop ODT commands, desktop source sync, and ODT conflict state should be removed from the core.

## Lexical React Direction

Use `@lexical/react` for the rendered editor surface:

- `LexicalComposer`
- `ContentEditable`
- React plugins for load/export, history, protected content, navigation, task checkboxes, callout folding, and heading collapse
- `@lexical/html` for HTML import/export

Keep direct `lexical` imports only where Lexical requires them:

- custom node classes
- `LexicalEditor` types
- node helpers such as `$getRoot`
- tests that instantiate an editor with `createEditor`

Do not pretend direct `lexical` can disappear completely. The useful target is: React owns editor composition and runtime behavior; core `lexical` is limited to node/model primitives.

## Must Change

| Area                  | Files                                                                                                                                                                                                                                | Current LibreOffice/ODT dependency                                                                             | Target change                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Package and build     | `package.json`, `package-lock.json`                                                                                                                                                                                                  | Build bundles `runtime/`; dependencies do not currently declare `@lexical/react`                               | Add direct `@lexical/react`; remove runtime packaging assumptions; update lockfile                                        |
| Runtime packaging     | `scripts/bundle-plugin.mjs`, `scripts/prepare-runtime.mjs`, `scripts/runtime-pruning.mjs`, `runtime/`                                                                                                                                | Prepares and bundles LibreOffice payloads                                                                      | Stop copying runtime payloads; delete runtime prep scripts if unused; keep no required runtime directory                  |
| Plugin startup        | `src/main.ts`, `src/mainRuntime.test.ts`, `src/mainTestHelpers.ts`                                                                                                                                                                   | Detects Office runtime, registers ODT command, passes runtime state into editor options, sets desktop platform | Remove runtime detection and ODT command registration; initialize HTML-first store/view options; update startup mocks     |
| Settings model        | `src/settings/interfaces.ts`, `src/settings/constants.ts`, `src/settings/helpers.ts`, `src/settings/Settings.ts`, `src/settings/runtime/runtime.ts`, `src/settings/**/*.test.ts`, `src/settings/__snapshots__/**`                    | `libreOfficePath`, `desktop-odt`, `html-fallback`, automatic runtime source resolution                         | Replace with simple HTML editor settings; delete runtime bridge; migrate old settings safely                              |
| Runtime module        | `src/office-runtime/**`                                                                                                                                                                                                              | Detects and validates bundled LibreOffice                                                                      | Delete after all imports are removed                                                                                      |
| ODT conversion module | `src/conversion/**`                                                                                                                                                                                                                  | Mixes LibreOffice conversion with sanitizer exports                                                            | Split sanitizer into a non-Libre module first, then delete ODT conversion code                                            |
| Desktop command       | `src/desktop-odt-command/**`                                                                                                                                                                                                         | Opens active note in LibreOffice ODT                                                                           | Delete command and tests                                                                                                  |
| Editor options        | `src/editor-view/options/options.ts`, `src/editor-view/options/options.test.ts`                                                                                                                                                      | Wires `prepareDesktopSource`, `syncDesktopSource`, and conversion runtime                                      | Remove desktop callbacks; keep Markdown import, save, sync, and navigation                                                |
| Editor view lifecycle | `src/editor-view/EditorView.tsx`, `src/editor-view/interfaces.ts`, `src/editor-view/state/state.ts`, `src/editor-view/app-element/appElement.ts`, `src/editor-view/desktop-source/**`, `src/editor-view/constants.ts`, tests         | Tracks active source, runtime status, desktop source status, and ODT sync on blur/load                         | Remove desktop source lifecycle; blur can flush HTML only if needed; delete desktop-source folder                         |
| App props             | `src/App.tsx`, `src/interfaces.ts`, `src/__snapshots__/App.test.tsx.snap`, app tests                                                                                                                                                 | Passes runtime status, editor mode, active source, desktop source status                                       | Remove ODT/runtime props; pass only save status, layout, warnings, file path, HTML source, navigation, conflict callbacks |
| Ribbon UI             | `src/ribbon-editor/RibbonEditor.tsx`, `src/ribbon-editor/interfaces.ts`, `src/ribbon-editor/status-footer/**`, `src/ribbon-editor/desktop-source-loader/**`, ribbon tests and snapshots                                              | Shows ODT loader, active ODT/HTML source, runtime status, desktop mode                                         | Remove ODT loader and runtime/footer status; keep OneNote shell and HTML editor                                           |
| Rich document model   | `src/rich-documents/interfaces.ts`, `src/rich-documents/constants.ts`, `src/rich-documents/mapping/mapping.ts`, `src/rich-documents/paths/paths.ts`, `src/rich-documents/plugin-data/**`, `src/rich-documents/vault/vault.ts`, tests | Stores `odtPath`, `activeSource: 'odt'`, `sourceStates.odt`, `odtSyncedAt`                                     | Migrate to Markdown plus HTML only; normalize old ODT fields away safely                                                  |
| Conflict detection    | `src/conflicts/**`, `src/conflict-recovery/**`                                                                                                                                                                                       | Tracks/copies/resolves ODT, desktop, and mobile sources                                                        | Use source choices: rich HTML, Markdown mirror, duplicate copy; remove ODT/desktop/mobile conflict choices                |
| Source writes         | `src/source-write/**`                                                                                                                                                                                                                | Treats ODT as a rich source that can change independently; imports sanitizer from `conversion`                 | Use HTML as the only rich source; import sanitizer from new sanitizer module                                              |
| Markdown import       | `src/markdown-sync/markdownSync.ts`, `src/markdown-sync/constants.ts`, tests                                                                                                                                                         | Uses `HTML_FALLBACK_ACTIVE_SOURCE`; imports sanitizer from `conversion`                                        | Rename to HTML active source language; import sanitizer from new sanitizer module                                         |
| HTML editor sanitizer | `src/html-editor/lexical-source/source-html/sourceHtml.ts`, tests                                                                                                                                                                    | Imports sanitizer from `conversion`                                                                            | Import sanitizer from new sanitizer module                                                                                |
| Lexical React surface | `src/html-editor/lexical-source/LexicalSource.tsx`, `src/html-editor/lexical-source/plugins/**`, `src/html-editor/lexical-source/html-element/**`, `package.json`                                                                    | Visible editor is controlled `contentEditable`; Lexical helpers exist but are not the React surface            | Use `@lexical/react` composition and plugins for the live editor; keep direct `lexical` only for node classes/helpers     |
| Documentation         | `SYSTEM_DESIGN.md`, `src/**/README.md`, `docs/implementation-plans/**`, `docs/initial.md`, `THIRD_PARTY_NOTICES.md`                                                                                                                  | Describes LibreOffice/ODT as core                                                                              | Rewrite to HTML/Lexical core; mark old ODT plans obsolete or remove                                                       |

## Current Search Evidence

The inventory above is based on current-tree searches for these terms across `src`, `scripts`, package files, and build files:

- `LibreOffice`
- `libreoffice`
- `office-runtime`
- `desktop-odt`
- `Desktop ODT`
- `ODT`
- `odt`
- `desktop source`
- `desktop-source`
- `runtime status`
- `officeRuntime`

The search currently finds production modules, tests, test helpers, snapshots, package lock data, and runtime packaging scripts. When implementation starts, use the same search as a gate after every removal plan.

## Delete Candidates

Delete only after imports and tests are moved:

- `src/office-runtime/`
- `src/desktop-odt-command/`
- `src/editor-view/desktop-source/`
- ODT-specific parts of `src/conversion/`
- `scripts/prepare-runtime.mjs`
- `scripts/runtime-pruning.mjs`
- bundled LibreOffice payload directories under `runtime/`
- `src/ribbon-editor/desktop-source-loader/`

## Rename Candidates

These are not required for functional removal, but they reduce conceptual noise:

- `HTML_FALLBACK_ACTIVE_SOURCE` -> `HTML_ACTIVE_SOURCE`
- `DesktopSourceLoader` -> delete, not rename
- `officeRuntimeSetupState` -> delete
- `desktopSourceStatus` -> delete
- `desktopHtmlSource` in conflict creation -> `currentHtmlSource`
- conflict choices `desktop` and `mobile` -> `html` or duplicate flow

## Migration Notes

- Existing mapping sidecars and plugin data may contain `odtPath`, `sourceStates.odt`, `syncTimestamps.odtSyncedAt`, and `activeSource: 'odt'`.
- Normalizers should accept old fields during one migration window and emit the new HTML-only mapping shape.
- Existing `.odt` files in `.libre-note-editor/documents/<rich-id>/document.odt` should not be deleted automatically in the first implementation pass. Leave them orphaned or move them to conflict/archive only after an explicit cleanup plan.
- Conflict copies with source `odt`, `desktop`, or `mobile` should remain readable during recovery, but new conflicts should not create new ODT copies.

## Verification Themes

- Opening Markdown creates/loads HTML without runtime detection.
- Autosave writes `document.html`.
- Markdown mirror sync still preserves frontmatter, links, tags, callouts, tasks, code, tables, images, and protected raw Markdown.
- Conflicts preserve Markdown and HTML versions only.
- Settings no longer mention LibreOffice, ODT, runtime, or desktop source.
- Build no longer requires prepared runtime directories.
- Knip no longer reports deleted runtime/conversion exports as used.
