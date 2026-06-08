# Libre Note Editor Project Conventions

Read this document before writing, editing, or reviewing code in this repository.
It is the source of truth for structure, naming, testing, linting, and quality rules.

## Core Rules

These rules are strict and mandatory.

- Preferred stack: React, React Testing Library, Node, and TypeScript.
- Write React components as functional components with hooks.
- Use classes only when an external API requires inheritance, such as Obsidian `Plugin` and `FileView` subclasses.
- Extract new logical blocks into dedicated files and cover every path with tests.
- Add short orienting comments above non-obvious logic, framework lifecycle hooks, routing side effects, and cross-boundary integration points.
- Separate logical code sections with blank lines.
- Use full descriptive names. Do not abbreviate identifiers.
- Prioritize readability, maintainability, and reduced redundancy.
- If blocked, add debug instrumentation, rerun, and continue with evidence.
- Fix implementation issues first, then verify affected Obsidian plugin behavior through Obsidian MCP before calling the work complete. If connection issues, fix connection issues, DO ALL YOU CAN TO CONNECT TO OBSIDIAN AND TEST. **This is a hard check**.
- Finish development with passing format, lint, and type checks.

## Module Layout And File Limits

Every feature folder must follow this limit-first structure:

```text
<feature>/
|-- <Feature>.tsx or <feature>.ts   # one primary implementation file only
|-- constants.ts                    # all constants for the feature
|-- interfaces.ts                   # all types, interfaces, and enums
`-- helpers.ts                      # separable functions for the feature
```

Required limits:

- Each folder may contain only one primary implementation file, one `constants.ts`, one `interfaces.ts`, and one `helpers.ts`.
- Each source file must stay at or below 150 lines, excluding import lines.
- If a file would exceed 150 lines, split the logic into a subfolder and apply the same structure there.
- If `helpers.ts` would exceed 150 lines, create a `helpers/` folder and split helper logic into helper subfolders.
- Files or folders named `helper` or `helpers` are private to their containing feature folder. Shared feature APIs must be exposed through `index.ts` or a named module.
- A path may contain at most one `helper`, `helpers`, or `utils` level. Promote nested helper or utility code into a named feature folder.
- Files that only re-export other modules must be named `index.ts`.
- Exported functions are local unless promoted through parent `index.ts` files. A function may be imported within its local folder scope; each parent `index.ts` re-export lifts that function's allowed import scope one folder higher.
- Folder names use kebab-case.
- React component files use PascalCase.
- Non-React logic and helper files use camelCase.
- Avoid duplicate logic across sibling folders. Move shared logic into a shared subfolder with the same limits.

## Naming

### Files

| Thing                     | Convention        | Example                                |
| ------------------------- | ----------------- | -------------------------------------- |
| React component file      | PascalCase `.tsx` | `BasicTextGroup.tsx`                   |
| Non-React logic file      | camelCase `.ts`   | `clearFormatting.ts`                   |
| Class name package import | `classNames` name | `import classNames from 'classnames';` |
| Unit test file            | `<name>.test.ts`  | `clearFormatting.test.ts`              |
| RTL integration test file | `<Name>.test.tsx` | `BasicTextGroup.test.tsx`              |

### Identifiers

All identifiers must be descriptive: variables, parameters, constants, type aliases, hooks, and helper names.

| Banned           | Use instead                                  | Where                              |
| ---------------- | -------------------------------------------- | ---------------------------------- |
| `ed`, `e`        | `editor`, `getEditor`                        | Editor accessor and handler locals |
| `fp`             | `formatPainter`                              | Format painter context value       |
| `FPFormat`       | `FormatPainterFormat`                        | Interface name                     |
| `FPContextValue` | `FormatPainterContextValue`                  | Interface name                     |
| `useFP`          | `useFormatPainterContext`                    | Consumer hook                      |
| `exec`           | `executeCommand`                             | Editor command helper              |
| `ws`             | `workspaceElement`                           | DOM element variable               |
| `hmc`            | `horizontalMainContainer`                    | DOM element variable               |
| `fmt`            | `newFormat` or `format`                      | Format painter parameter or state  |
| `sel`            | `selection`                                  | Editor selection string            |
| `src`            | `sourceText`                                 | Text being inspected               |
| `tmpl`           | `template`                                   | Template string                    |
| `t`              | `clipboardText`, `text`, etc.                | Callback parameter                 |
| `f`, `s`, `c`    | `fontName`, `pointSize`, `colorItem`         | Loop variables                     |
| `i`              | `index`, `rowIndex`                          | Loop or map index                  |
| `k`, `v`         | `key`, `value`                               | Object or map iteration            |
| `mh`             | `estimatedMaxHeight`                         | Computed layout value              |
| `ref1`, `ref2`   | `leafChangeEventRef`, `editorChangeEventRef` | Event refs                         |
| `fmtDate`        | `formatCurrentDate`                          | Function name                      |
| `fmtTime`        | `formatCurrentTime`                          | Function name                      |
| `now`            | `currentDate`                                | Date variable                      |
| `el`             | `element`                                    | DOM element                        |
| `titlebar`       | `titlebarElement`                            | DOM element                        |

Single-letter names are not allowed outside tight numeric `for` loops. Prefer `index` even there.

## Styling

- Read `DESIGN.md` before adding or changing components or styles.
- Every visual choice must trace back to a named design principle.
- If a design choice is not covered, update `DESIGN.md` before adding code.
- Use Tailwind classes for component styling.
- Do not add feature CSS files or import CSS outside `src/main.ts`.
- `styles.css` at the repo root is the only allowed CSS file because Tailwind v4 uses it for setup.
- Use the `classnames` package for conditional class composition.
- Import it as `classNames`: `import classNames from 'classnames';`.
- If a JSX `className` value is long, assign it to a named const before the `return`.
- Do not use inline styles except for dynamic runtime values such as dropdown position.

## Tests

All test files must be colocated with the module they test.

- Pure logic tests use `<fileName>.test.ts`.
- React Testing Library integration tests use `<ComponentName>.test.tsx`.
- Do not create dedicated `tests/` folders for feature modules.
- If a test file becomes too large, split the tested logic or split the component into smaller modules first.
- Tests must assert exact required behavior.
- Every `test` or `it` case must include at least one assertion.
- Do not use weak assertions such as `toBeTruthy`, `toBeFalsy`, `toBeDefined`, or `toBeUndefined`.
- Use `toBe` for primitive expected values instead of `toEqual`.
- Component `.test.tsx` files must include at least one snapshot assertion.
- Component tests should use React Testing Library and Jest.

## Code Quality

Code quality, readability, and redundancy reduction are the highest priorities. Prefer explicit, readable code over clever or compact code.

1. No globals. Never use `window.*` or other global state; use React context.
2. No side effects at module load. Put effects inside hooks, components, or explicit functions.
3. TypeScript must stay strict. Run `tsc --noEmit`; do not use `any` except in test utility mock casts.
4. Interfaces, types, and enums must be as narrow as the real domain allows: prefer literal unions, readonly fields, discriminated unions, and precise nullable states over broad strings, loose objects, or optional fields.
5. Shared domain types should be reused from the nearest appropriate `interfaces.ts`; move a type upward only when multiple folders genuinely need the same contract.
6. Button handlers must guard the editor before use: `const editor = getEditor(); if (!editor) return;`.
7. Define the editor accessor at component top level: `const getEditor = () => app.workspace.activeEditor?.editor;`.
8. Do not use component-level polling with `requestAnimationFrame` or `setInterval` to synchronize editor UI state.
9. Extract multi-line JSX handlers into named functions declared above the `return`.
10. Leave no `console.log` in production code. Debug logs are acceptable in tests only.
11. Separate distinct statement groups with a blank line. No statement group may exceed 4 lines unless it is one multi-line statement such as a function call, parameter list, object literal, or JSX return.
12. Keep one blank line between third-party imports and local imports.
13. Add comments above code whose purpose is not immediately obvious, especially lifecycle hooks, event routing, type narrowing, persistence boundaries, Obsidian workspace behavior, and cleanup paths.
14. Keep source files at or below 150 lines, excluding imports.

## Comments

Comments should make the next reader faster without narrating syntax.

- Prefer one short line above the code it explains.
- Explain why the code exists or when an external framework calls it.
- Comment Obsidian lifecycle hooks, workspace leaf routing, file state restoration, plugin unload cleanup, async ordering, and any fallback path.
- Do not comment obvious assignments, JSX labels, imports, or names that already describe the behavior.
- If a comment needs more than two lines, consider extracting a helper with a descriptive name.

## Completion Checklist

Before finishing any development task:

- Run `npm test` when tests exist for the touched behavior.
- Run `npm run format:check`.
- Run `npm run lint`.
- Run `npm run typecheck` or `tsc --noEmit`.
- Check touched `helpers.ts`, `constants.ts`, and `interfaces.ts` files for redundant exports, duplicate logic, unused types, and values that should be shared or removed.
- Check touched interfaces and types for strictness, maximum practical reuse, and unnecessary local duplicates before finishing.
- Confirm any new feature folder includes `constants.ts` and `interfaces.ts`.
- Confirm any new component styling follows `DESIGN.md` and uses Tailwind utilities.
- Dropdown and modal tests must include behavior assertions, snapshots, and computed CSS assertions.
- Verify affected Obsidian plugin behavior through Obsidian MCP after the fix and before the final response.

## Obsidian Plugin Workflow

Before live plugin work, verify Obsidian is available through Obsidian MCP and running in debug mode on port `9222`.

After code changes:

1. Run `npm test`.
2. Run lint and type checks.
3. Test live in Obsidian through Obsidian MCP when the change affects plugin behavior.
4. Use `npm run dev` for watch builds when manually verifying in Obsidian.
5. Reload the plugin by disabling and enabling it before claiming live behavior is confirmed.
6. If Obsidian MCP is unavailable or cannot complete the check, do not claim live behavior is confirmed; report the blocker and the exact verification still needed.

When stuck, add targeted debug output or instrumentation, rerun, and continue from the evidence. If the issue still cannot be resolved, ask for the runtime output needed to keep going.
