# Plan 16C: Task List Toggle Parity

## Goal

Make task-list checkboxes look and behave like Obsidian Markdown task checkboxes, including toggling the Markdown mirror between incomplete and complete states.

## Implement

- Preserve imported task checkbox inputs instead of treating them as locked void-only content.
- Add a scoped task-list interaction plugin under `html-editor/lexical-source/` or a dedicated subfolder that follows repository structure limits.
- On checkbox click or keyboard activation:
  - toggle the checkbox `checked` property
  - update the owning `li` `data-task` value between an incomplete and complete state
  - emit the normal HTML source change path so autosave sees the change
  - keep the text cursor stable near the task item
- Update Markdown export so incomplete task items export `- [ ]` and complete task items export `- [x]`.
- Keep nested task lists and mixed normal/task lists stable.

## Tests

- Test import preserves checkbox state and task list classes.
- Test clicking a checkbox changes `data-task` and emits changed HTML.
- Test keyboard activation changes state.
- Test autosave exports:
  - `- [ ] Task`
  - `- [x] Task`
  - nested task lists
  - mixed normal and task list items
- Snapshot task-list rendering.

## MCP Verification

- Open a fixture note with checked, unchecked, nested, and mixed task lists.
- Toggle checkboxes with mouse and keyboard.
- Verify:
  - visual state changes immediately
  - text cursor does not jump unpredictably
  - Markdown mirror updates after autosave
  - Obsidian native Markdown view shows the same task states after sync

## Edge Cases

- Multiple checkbox clicks before autosave.
- Checkbox inside protected/raw content.
- Nested tasks under ordered lists.
- Task item with no text.
- Task item with links, tags, or inline code.
- Undo/redo after toggling.
- External Markdown edit changing task state during autosave.

## Done When

- Task checkboxes behave like Obsidian task items and round-trip through the Markdown mirror.
- Tests, format check, lint, typecheck, and Obsidian MCP verification pass.
