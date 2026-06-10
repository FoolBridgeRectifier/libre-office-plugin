# Conflicts Module

## What It Does

`conflicts` detects source drift, snapshots conflicting versions, and resolves rich-document conflicts without silently discarding user data.

The module compares stored source states against current vault state for Markdown and HTML. When multiple sources have changed or a rich file disappears, it writes timestamped conflict copies under the rich-document folder and marks the mapping conflicted.

## Main Components

- `index.ts` exports conflict creation, source-state helpers, and resolution.
- `interfaces.ts` defines conflict creation options, conflict copy requests, source snapshots, source-state changes, and resolution choices.
- `constants.ts` defines the `conflicts` subfolder name used inside each rich-document folder.
- `copies/copies.ts` writes conflict copies for existing Markdown and current rich HTML sources.
- `source-state/sourceState.ts` creates FNV-style content hashes, source snapshots, full source-state sets, and source-state change lists.
- `resolution/resolution.ts` applies the selected conflict choice, writes the selected source back to the appropriate file, regenerates Markdown or HTML where possible, and clears the conflict state.
- `resolution/utils.ts` maps choices to active sources, reads selected conflict copies, creates duplicate copies, and updates sync timestamps.

## How It Is Used

`source-write` asks this module to compare source states before saving or syncing. `editor-view` calls conflict resolution when the user chooses a recovery option. `rich-documents` stores the resulting conflict state in the mapping.
