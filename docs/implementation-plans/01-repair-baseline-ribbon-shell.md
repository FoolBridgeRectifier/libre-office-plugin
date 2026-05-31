# Plan 01: Repair Baseline Ribbon Shell

## Goal

Make the current plugin buildable by replacing the missing `ribbon-editor` dependency with a convention-compliant starter shell.

## Implement

- Create `src/ribbon-editor/`.
- Add `RibbonEditor.tsx`, `constants.ts`, `interfaces.ts`, and `helpers.ts`.
- Keep the shell visual only: tab bar, command groups, active tab state, placeholder editor surface, and status text.
- Use Fluent icons when icons are needed.
- Use Tailwind token aliases from `DESIGN.md`.
- Preserve the current `App` public behavior expected by `App.test.tsx`.
- Avoid real editor persistence in this plan.

## Tests

- Keep or update `src/App.test.tsx` for the rendered shell.
- Add `src/ribbon-editor/RibbonEditor.test.tsx`.
- Assert:
  - `Home` tab is active by default.
  - Clicking `Insert` changes command content.
  - Keyboard focus is visible on tab buttons through class or computed style.
  - Disabled or future commands remain visible and clearly disabled.
  - Snapshot covers the shell.

## MCP Verification

- Confirm Obsidian is available through MCP on debug port `9222`.
- Run `npm run dev`.
- Reload the plugin by disabling and enabling it.
- Open the Libre Note Editor view.
- Verify in MCP:
  - The view renders without console errors.
  - The ribbon tab bar is visible.
  - Tab clicks update visible commands.
  - Focus can move through controls with the keyboard.
  - No markdown file behavior is changed yet.

## Edge Cases

- Missing Obsidian theme tokens fall back to readable colors.
- Dark theme keeps contrast on tabs, labels, and command buttons.
- Narrow pane does not clip tab labels or command groups.
- Reopening the view does not duplicate React roots.
- Plugin unload unmounts the React tree cleanly.

## Done When

- `npm test`, `npm run format:check`, `npm run lint`, and `npm run typecheck` pass.
- Live shell renders in Obsidian after plugin reload.
