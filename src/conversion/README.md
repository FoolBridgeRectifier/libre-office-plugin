# Conversion Module

## What It Does

`conversion` handles local LibreOffice conversion between rich HTML and ODT, validates generated ODT packages, sanitizes converted HTML, and updates rich-document mapping state after desktop sync.

All conversion is local. The module builds safe LibreOffice command arguments and keeps generated files inside `.libre-note-editor/documents/`.

## Main Components

- `conversion.ts` provides the high-level desktop flow: create runtime, ensure an ODT source exists, open ODT in LibreOffice, detect saved ODT changes, convert ODT back to HTML, regenerate the Markdown mirror, and update mapping state.
- `helpers.ts` builds LibreOffice commands, validates conversion paths, resolves local vault paths, requires a ready runtime, runs conversion commands, and updates desktop sync timestamps.
- `interfaces.ts` defines conversion commands, runtime process contracts, conversion paths, conversion options, and sanitization results.
- `constants.ts` defines timeouts, ODT package markers, conversion temp filenames, desktop-only selectors, and unsafe converted HTML selectors.
- `odt-input/odtInput.ts` wraps HTML in a minimal document for LibreOffice and defines temp input/output paths.
- `sanitizer/sanitizer.ts` removes scripts, remote executable content, dangerous attributes, unsafe styles, remote media loading, and marks desktop-only content protected.
- `test-runtime/testRuntime.ts` supplies conversion test doubles for vault adapters, stores, ODT content, and process execution.

## How It Is Used

`editor-view/options` wires conversion into editor lifecycle. On desktop, the view syncs saved ODT changes back to HTML and Markdown, and prepares an ODT source from HTML before opening LibreOffice. `desktop-odt-command` uses the same flow for the explicit open command.
