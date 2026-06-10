# Ribbon Editor Module

## What It Does

`ribbon-editor` renders the visible Libre Note Editor shell: OneNote-style tabs and command groups, the rich HTML editor surface, conflict recovery, and status footer.

The visual structure follows `DESIGN.md`: OneNote layout patterns with Obsidian theme tokens and Tailwind utilities.

## Main Components

- `RibbonEditor.tsx` composes the full shell, active ribbon tab state, command groups, editor surface, conflict panel, HTML editor, and footer.
- `constants.ts` defines the current ribbon tab model and command metadata.
- `helpers.ts` resolves active tabs, maps command icon names to Fluent UI icons, builds command/page class names, and turns autosave/link warning state into status text.
- `interfaces.ts` defines ribbon tab/command structures and shell props.
- `status-footer/StatusFooter.tsx` renders layout, link-warning, save-status, and active-file status text.
- `tab-bar/TabBar.tsx` renders ribbon tabs and delegates class-name generation to `tab-bar/helpers.ts`.

## How It Is Used

`App.tsx` renders `RibbonEditor`. `editor-view` feeds it current file, autosave status, layout, imported HTML, link warning counts, and callbacks for editing, blur, navigation, and conflict resolution.
