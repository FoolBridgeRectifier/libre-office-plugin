# Libre Note Editor Design Reference

This document is the source of truth for visual design, interaction, spacing, colors, layout, and UX decisions.
Keep CSS and component behavior aligned with these principles.

## Design Context

### Users

Users are familiar with OneNote and want that editing workflow inside Obsidian. The interface should reward muscle memory instead of introducing new interaction patterns.

Optimize for speed, comfort, and immediate recognition.

### Product Personality

Structured. Refined. At home in Obsidian.

Libre Note Editor should feel like a natural Obsidian workspace that borrows OneNote's layout patterns, not like a separate app embedded inside Obsidian.

### Aesthetic Direction

Blend OneNote's structural conventions with Obsidian's visual sensibility.

- From OneNote: tab bar, command groups, large primary buttons, small stacked buttons, purple tab anchor, warm hover states, stroke icons, and small uppercase group labels.
- From Obsidian: theme-aware colors, typography, panel depth, radius, focus styles, and dark-mode behavior.

## Design Principles

### 1. OneNote Structure, Obsidian Skin

Layout, grouping, and command hierarchy come from OneNote. Color, typography, depth, and theme integration come from Obsidian.

### 2. Token-Only Colors

Component CSS must use `var(--...)` tokens for color values.

Allowed exceptions:

- Token declarations.
- Functional swatch values where the exact color is the user-facing data, such as text highlight colors.

Preferred tokens:

| Token                      | Role                               |
| -------------------------- | ---------------------------------- |
| `--ribbon-purple`          | Fixed OneNote-style tab bar anchor |
| `--ribbon-purple-mid`      | Tab bar hover state                |
| `--ribbon-bg`              | Ribbon body background             |
| `--ribbon-border`          | Group dividers and button borders  |
| `--btn-hover-bg`           | Warm button hover fill             |
| `--btn-hover-border`       | Warm button hover border           |
| `--btn-active-bg`          | Pressed or active button fill      |
| `--btn-active-border`      | Pressed or active button border    |
| `--btn-focus-ring`         | Keyboard focus outline             |
| `--text-primary`           | Primary body text                  |
| `--text-secondary`         | Secondary text                     |
| `--text-muted`             | Muted labels and group headers     |
| `--text-disabled`          | Disabled text                      |
| `--editor-bg`              | Editable Markdown surface          |
| `--editor-text`            | Editable Markdown body text        |
| `--editor-muted`           | Muted Markdown editor text         |
| `--editor-border`          | Editor-only structure borders      |
| `--editor-caret`           | Current theme caret color          |
| `--editor-selection`       | Editor selection background        |
| `--editor-code-bg`         | Inline and fenced code background  |
| `--editor-code-text`       | Inline and fenced code text        |
| `--editor-mark-bg`         | Markdown highlight background      |
| `--editor-mark-text`       | Markdown highlight text            |
| `--editor-quote-border`    | Blockquote leading border          |
| `--editor-table-header-bg` | Table header background            |
| `--editor-hr`              | Horizontal rule border             |
| `--shadow-ribbon`          | Ribbon shadow                      |
| `--transition-fast`        | Button hover transitions           |
| `--transition-mid`         | Dropdown and panel transitions     |
| `--radius-sm`              | Small shared radius                |
| `--icon-color`             | Default icon stroke                |
| `--icon-purple`            | Purple accent icons                |
| `--icon-blue`              | Informational icons                |
| `--icon-green`             | Success icons                      |
| `--icon-orange`            | Warning icons                      |
| `--icon-red`               | Destructive icons                  |
| `--icon-teal`              | Secondary accent icons             |

### 3. Warm, Never Cool

Hover states, borders, and backgrounds should use warm-tinted grays. Avoid flat white, slate gray, and blue-gray surfaces unless inherited from the active Obsidian theme token.

### 4. Dark Mode Via Tokens

The editor UI must adapt to Obsidian's active theme. The purple tab anchor remains purple in every theme.

### 5. Accessibility As A Floor

WCAG AA contrast is required for text and controls. Focus rings, keyboard access, and reduced-motion support are required for interactive UI.

## Icon System

Prefer Fluent UI React Icons from `@fluentui/react-icons` before creating any custom icon.

- Import only the icon components that are used.
- Choose regular stroke icons unless a filled icon is needed for an active or selected state.
- Use Fluent icon sizes that match the command size, such as 20px icons for large commands and 16px icons for compact controls.
- Icons inherit color from the parent control through `currentColor`.
- Do not set `fill` or `stroke` directly on icon components unless the icon represents functional color data.
- Create a custom icon only when Fluent UI does not provide a semantically accurate option.

## Typography

Use the host-platform feel first. The preferred font stack is:

```css
"Segoe UI", system-ui, -apple-system, sans-serif
```

| Context                   | Size    | Weight                  |
| ------------------------- | ------- | ----------------------- |
| Tab bar tabs              | 11px    | 500, or 600 when active |
| Group labels              | 9-10px  | Uppercase               |
| Dropdown items            | 11px    | 400                     |
| Dropdown sub-labels       | 9px     | 400                     |
| Inline format buttons     | 12-13px | Per button              |
| Button labels below icons | 10px    | 400                     |

## Layout And Interaction

- Command groups should be compact, scannable, and separated by light dividers.
- Primary commands may use larger icon buttons.
- Secondary commands should use smaller stacked or inline buttons.
- Dropdowns should open close to their trigger and avoid layout shift.
- Disabled controls should remain visible but clearly unavailable.
- Motion should be short and functional, never decorative.

## Implementation Notes

- Define shared design tokens before using them in Tailwind classes.
- Do not add feature CSS files. Component styling should be expressed with Tailwind utilities.
- Prefer Obsidian theme variables when they preserve the design principle.
- Update this document before adding a visual pattern that is not covered here.

## Tailwind Setup

Tailwind CSS is available through `styles.css` at the repo root and is compiled by the esbuild CSS injector through PostCSS.

- `postcss.config.mjs` registers `@tailwindcss/postcss`.
- `esbuild.config.mjs` runs imported CSS through PostCSS before injecting it into the plugin bundle.
- `src/main.ts` imports `../styles.css` once at plugin entry.
- `styles.css` declares Tailwind theme and utilities only.
- `styles.css` is the only allowed CSS file; it exists only for Tailwind setup and token aliases.
- Tailwind Preflight is intentionally disabled so Obsidian's host UI is not reset by plugin styles.
- Tailwind scans only `src/` for utility classes through the CSS `@source './src';` directive.
- Design tokens stay in `:root` as `--ribbon-*`, `--btn-*`, `--text-*`, and `--icon-*`.
- Tailwind theme aliases are declared with `@theme inline` and point back to those design tokens.
- Use the `classnames` package for conditional class composition.
- Import it as `classNames`: `import classNames from 'classnames';`.
- Long JSX `className` values must be assigned to named consts before the component `return`.

Use Tailwind for layout, spacing, typography, and state utilities. When a repeated pattern emerges, extract the React component or class-name const instead of creating CSS selectors.
