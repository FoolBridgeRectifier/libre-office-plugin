# HTML Editor Module

## What It Does

`html-editor` provides the local Lexical-backed HTML editing surface used by the ribbon shell.

It prepares imported HTML for editing, loads it into a bundled local Lexical editor, locks source-preserved content, removes unsafe or remote-loading content, tracks dirty state, and emits sanitized HTML changes.

## Main Components

- `HtmlEditor.tsx` renders empty/error states, unsafe-content warnings, and the Lexical-backed source editor.
- `lexical-source/` owns Lexical composition, HTML import/export, generic HTML element preservation, read-only locked HTML nodes, and locked-content `beforeinput` guards.
- `lexical-source/source-html/sourceHtml.ts` sanitizes fragments, removes remote loading elements and asset attributes, adds responsive image/table wrappers, locks source-preserved content for editing, and reads sanitized HTML back from the editor.
- `constants.ts` defines editor class names, locked editor attributes/classes, and selectors for remote or source-preserved content.
- `interfaces.ts` defines editor props and callbacks.
- `index.ts` re-exports the component.

## How It Is Used

`ribbon-editor` renders `HtmlEditor` inside the editor surface. Input events flow to `editor-view`, which forwards them to `autosave`; blur events trigger desktop-source sync when desktop ODT mode is active.
