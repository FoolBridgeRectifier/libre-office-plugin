# Plan 18C: Remove Desktop ODT Lifecycle

## Goal

Remove ODT preparation/sync from editor view load, blur, render state, and options.

## Implement

- Update `src/editor-view/interfaces.ts`:
  - remove `getActiveEditorSource`
  - remove `getOfficeRuntimeSetupState`
  - remove `prepareDesktopSource`
  - remove `syncDesktopSource`
  - remove `desktopSourceStatus`
  - remove ODT-specific render target fields
- Update `src/editor-view/options/options.ts` to stop importing conversion APIs.
- Delete or empty out `src/editor-view/desktop-source/` after no imports remain.
- Update `src/editor-view/EditorView.tsx`:
  - remove `activeEditorSource`
  - remove `desktopSourceStatus`
  - remove runtime setup state
  - stop refreshing desktop source after load
  - make blur either no-op or flush pending HTML, based on current autosave expectations
- Update `src/editor-view/state/state.ts` and `src/editor-view/app-element/appElement.ts` to pass only HTML editor state.
- Remove ODT command constants from `src/editor-view/constants.ts`.
- Update `src/interfaces.ts`, `src/App.tsx`, and App snapshots after render props are simplified.

## Tests

- Update `EditorView` load/blur tests.
- Delete or rewrite `desktop-source` tests.
- Update editor options tests to cover Markdown import/save/sync and navigation only.
- Update app element, App, and editor view snapshots.

## Done When

- Editor view has no desktop source status or ODT lifecycle callback.
- Opening a Markdown note loads HTML and renders without attempting conversion.
- Blur behavior still satisfies autosave expectations.
