# Conflict Recovery Module

## What It Does

`conflict-recovery` renders the conflict resolution panel shown when autosave detects an unresolved source conflict.

The panel gives the user direct choices for which preserved source to keep or whether to duplicate the current conflict copy.

## Main Components

- `ConflictRecovery.tsx` defines `ConflictRecoveryPanel`, a compact ribbon-aligned UI section with resolution buttons.
- `constants.ts` lists the available choices: desktop, mobile, markdown, and duplicate.
- `interfaces.ts` defines the choice definitions and panel props.
- `helpers.ts` builds the Tailwind class name for enabled and resolving button states.

## How It Is Used

`ribbon-editor` displays `ConflictRecoveryPanel` when the autosave status is `conflicted` and an `onResolveConflict` callback is available. The callback routes back through `editor-view` and the `conflicts` module.
