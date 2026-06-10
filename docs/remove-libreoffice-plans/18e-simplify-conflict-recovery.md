# Plan 18E: Simplify Conflict Recovery

## Goal

Remove ODT, desktop, and mobile source choices from conflict detection and recovery. Preserve Markdown and HTML versions only.

## Implement

- Update `src/conflicts/source-state/sourceState.ts` to snapshot Markdown and HTML only.
- Update `src/conflicts/copies/copies.ts` to copy Markdown and HTML only for new conflicts.
- Update `src/conflicts/interfaces.ts`:
  - remove `odt`
  - remove `desktop`
  - remove `mobile`
  - keep `markdown`, `html`, and `duplicate-conflict-copy`.
- Update `src/conflicts/resolution/**` so resolution choices write Markdown or HTML only.
- Update `src/conflict-recovery/constants.ts` labels to user-facing source names:
  - Rich HTML
  - Markdown
  - Duplicate
- Update `src/source-write/helpers.ts` and `src/source-write/sourceWrite.ts` to treat HTML as the only rich source.
- Rename `desktopHtmlSource` conflict fields to `currentHtmlSource` where practical.

## Tests

- Update conflict creation/copy tests.
- Update conflict recovery snapshots.
- Update source-write conflict tests for Markdown and HTML only.
- Add a migration-oriented test proving old ODT conflict copies do not break rendering.

## Done When

- New conflicts do not inspect, copy, or resolve ODT.
- Recovery UI no longer says Desktop or Mobile.
- Markdown and HTML conflict safety remains conservative.
