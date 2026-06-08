# HTML Editor Module

## What It Does

`html-editor` provides the local Lexical-backed HTML editing surface used by the ribbon shell.

It prepares imported HTML for editing, loads it into a bundled local Lexical editor, protects unsupported content, removes unsafe or remote-loading content, tracks dirty state, and emits sanitized HTML changes.

## Protected Content

Protected content is the existing internal name for HTML that must survive round trips but is not safely editable as normal rich text yet. Examples include frontmatter templates, Markdown source facts, raw Markdown fallback blocks, complex table source, remote-image fallbacks, and desktop-only embed fallbacks.

The stored marker is `data-libre-protected`. The editor adds `data-libre-editor-protected`, `contenteditable="false"`, and `libre-protected-html-block` only while rendering. `readHtmlFromEditor` removes those editor-only markers before saving so the persisted HTML keeps only the durable preservation marker.

## Main Components

- `HtmlEditor.tsx` renders empty/error states, unsafe-content warnings, and the Lexical-backed source editor.
- `lexical-source/` owns Lexical composition, HTML import/export, generic HTML element preservation, read-only locked HTML nodes, and protected-content `beforeinput` guards.
- `lexical-source/source-html/sourceHtml.ts` sanitizes fragments, removes remote loading elements and asset attributes, adds responsive image/table wrappers, protects `data-libre-protected` content, and reads sanitized HTML back from the editor.
- `constants.ts` defines editor class names, protected attributes/classes, and selectors for remote or protected content.
- `interfaces.ts` defines editor props and callbacks.
- `index.ts` re-exports the component.

## How It Is Used

`ribbon-editor` renders `HtmlEditor` inside the editor surface. Input events flow to `editor-view`, which forwards them to `autosave`; blur events trigger desktop-source sync when desktop ODT mode is active.
