# Desktop ODT Command Module

## What It Does

`desktop-odt-command` registers the Obsidian command that opens the active Markdown note's rich ODT source in local LibreOffice.

The command only applies to routable Markdown files and depends on the rich-document store plus a ready desktop runtime.

## Main Components

- `desktopOdtCommand.ts` registers `open-active-file-in-libreoffice-odt-editor`. It ensures the note has imported HTML, gets or creates the mapping, creates the desktop runtime, ensures the ODT file exists, and launches it.
- `interfaces.ts` defines the command target, registration options, and open options.
- `index.ts` re-exports the registration function.

## How It Is Used

`main.ts` registers the command during plugin load. The command is an explicit desktop editing entrypoint that complements the editor view's automatic desktop-source preparation.
