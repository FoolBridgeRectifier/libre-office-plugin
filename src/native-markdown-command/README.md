# Native Markdown Command Module

## What It Does

`native-markdown-command` registers the Obsidian command that opens the active note in Obsidian's native Markdown view.

It is a controlled fallback for users who need to inspect or edit the raw Markdown mirror.

## Main Components

- `nativeMarkdownCommand.ts` registers `open-active-file-in-markdown-editor`, checks that fallback visibility is enabled, marks the target leaf as a native fallback leaf, and opens the file through `editor-view` helpers.
- `interfaces.ts` defines the command target and options, including the shared `WeakSet` used to suppress automatic re-routing.
- `index.ts` re-exports the registration function.

## How It Is Used

`main.ts` registers this command and passes the `nativeFallbackLeaves` set. Workspace routing checks that set so a deliberate native fallback leaf is not immediately routed back into Libre Note Editor.
