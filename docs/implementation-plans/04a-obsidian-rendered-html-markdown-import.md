# Plan 04A: Obsidian Rendered HTML Markdown Import

## Goal

Replace the generic markdown-to-HTML import path with an Obsidian-rendered import path that matches Obsidian preview more closely and maps the rendered DOM into Libre Note Editor's rich document model.

## Decision

Use `MarkdownRenderer.render(...)` as the Obsidian runtime import path because the plugin should match Obsidian's own preview output, not the HTML shape produced by a separate markdown converter.

Keep source-level extraction limited to data that rendered HTML cannot preserve exactly, such as frontmatter, exact markdown spelling, protected comments, original fence metadata, and unsupported syntax.

## Source References

- Obsidian `MarkdownRenderer.render(...)` renders markdown into an HTML element and uses `sourcePath` to resolve relative internal links: https://obsidian-developer-docs.pages.dev/Reference/TypeScript-API/MarkdownRenderer/render
- Obsidian Flavored Markdown combines CommonMark, GitHub Flavored Markdown, LaTeX, and Obsidian extensions such as wikilinks, embeds, comments, highlights, tasks, callouts, block references, and tables: https://help.obsidian.md/obsidian-flavored-markdown
- Markdown and HTML do not translate one-to-one, so rendered HTML must not be treated as a lossless markdown AST.

## Implement

- Add an Obsidian-runtime renderer adapter under `src/markdown-sync/helpers/markdown/`.
- Keep the adapter small:
  - create a detached render container
  - create and load a parent `Component`
  - call `MarkdownRenderer.render(app, markdownSource, containerElement, sourcePath, component)`
  - unload the component after mapping is complete
- Split frontmatter before rendering with the existing `gray-matter` path so YAML keys and formatting are not read from Obsidian's property UI.
- Render only the markdown body when possible.
- Add a DOM cleanup helper before mapping:
  - remove Obsidian UI chrome
  - remove collapse indicators
  - remove copy-code buttons
  - remove list-bullet spans
  - ignore metadata and hidden frontmatter UI
- Add a DOM block walker that maps Obsidian-rendered blocks:
  - `h1` through `h6`
  - `p`
  - `ul`, `ol`, `li`
  - task list items and checkbox state
  - `blockquote`
  - `.callout`
  - `pre > code`
  - `table`
  - `hr`
- Add an inline walker that maps:
  - text nodes
  - `strong`
  - `em`
  - `del`
  - `mark`
  - inline `code`
  - `a`
  - line breaks
- Preserve unhandled DOM islands as protected raw HTML blocks instead of dropping them.
- When Obsidian rendering is unavailable or returns empty output for a non-empty body, preserve the raw markdown in a protected block instead of using a second renderer.

## Import Pipeline Logic

1. Read the markdown source from the vault file.
2. Split source into `frontmatter` and `bodyMarkdown`.
3. Parse lightweight markdown source facts that rendered HTML cannot preserve.
4. Render `bodyMarkdown` with Obsidian's `MarkdownRenderer.render(...)`.
5. Select the rendered content root from the detached container.
6. Clone the rendered root before cleanup so debug output can compare raw and cleaned DOM.
7. Remove Obsidian preview UI and generated controls from the cloned DOM.
8. Walk cleaned block nodes into Libre Note Editor's rich document model.
9. Reconcile rendered blocks with source facts where HTML is lossy.
10. Store unsupported markdown or unhandled HTML as protected raw blocks.
11. Serialize the model into the local HTML editor source.
12. Keep the original markdown source data needed for future markdown export.

## Markdown Source Fact Logic

Collect only facts that cannot be safely recovered from rendered HTML:

- `frontmatter`: exact YAML text between delimiters.
- `comments`: Obsidian `%%comment%%` ranges that do not render as visible content.
- `wikilinks`: original `[[target]]`, `[[target|alias]]`, heading, and block-id syntax.
- `embeds`: original `![[target]]` syntax and target text.
- `codeFences`: original language, fence marker length, and raw code text.
- `rawHtml`: original HTML ranges, because Obsidian sanitizes rendered HTML.
- `blockIds`: `^id` source locations.
- `hardBreaks`: source hard-break syntax where it matters for export.
- `unsupportedRanges`: source slices intentionally preserved as raw markdown.

Do not build a full second markdown renderer from these facts. Use them only to annotate or repair the Obsidian-rendered DOM mapping.

## HTML Cleanup Logic

Start from the rendered container and keep only content-bearing nodes:

- If the root contains `.markdown-preview-view`, walk into `.markdown-preview-section`.
- Remove `.mod-header`, `.metadata-container`, `.metadata-add-button`, and `.mod-frontmatter`.
- Remove `.markdown-preview-pusher` and sizing wrappers that do not contain content.
- Remove `.collapse-indicator`, `.heading-collapse-indicator`, `.callout-icon`, `.copy-code-button`, and `.list-bullet`.
- Remove hidden elements where `hidden`, `display: none`, or `aria-hidden="true"` marks generated UI.
- Keep semantic content classes such as `.el-p`, `.el-h1`, `.el-ul`, `.el-pre`, `.callout`, and `.callout-content`.
- Keep `data-*` attributes that carry meaning, such as `data-task`, `data-line`, `data-callout`, `data-callout-fold`, and `data-heading`.

If cleanup removes a node that contains non-whitespace text, log it in test diagnostics and preserve that node as raw HTML until the mapper supports it.

## HTML To Model Mapping Logic

Map by semantic element first, then by Obsidian classes when the element alone is ambiguous.

| Rendered HTML        | Model intent             | Mapping logic                                                                              |
| -------------------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| `h1` through `h6`    | Heading block            | Use tag level for heading depth and walk inline children after removing collapse controls. |
| `p`                  | Paragraph block          | Walk inline children and preserve `<br>` as line breaks.                                   |
| `ul`, `ol`           | List block               | Walk direct `li` children; store ordered state from tag name.                              |
| `li.task-list-item`  | Task item                | Read `data-task` and checkbox `checked`; map remaining child content as item body.         |
| `li`                 | List item                | Map inline children and nested block children separately.                                  |
| `.callout`           | Callout block            | Read `data-callout`, `data-callout-fold`, title DOM, and `.callout-content`.               |
| `blockquote`         | Quote block              | Map child blocks recursively unless it is a callout wrapper.                               |
| `pre > code`         | Code block               | Use `textContent`; ignore Prism token spans and copy buttons.                              |
| `code` outside `pre` | Inline code              | Use `textContent` as a protected inline text run.                                          |
| `table`              | Table block              | Walk `thead`, `tbody`, `tr`, `th`, and `td`; preserve inline cell content.                 |
| `hr`                 | Horizontal rule          | Map to a divider block.                                                                    |
| `a`                  | Link mark                | Use `href`, Obsidian link attributes, and source wikilink facts when available.            |
| `strong`             | Bold mark                | Apply bold to all descendant text runs.                                                    |
| `em`                 | Italic mark              | Apply italic to all descendant text runs.                                                  |
| `del`                | Strikethrough mark       | Apply strikethrough to all descendant text runs.                                           |
| `mark`               | Highlight mark           | Apply highlight to all descendant text runs.                                               |
| unknown element      | Raw block or inline span | Preserve as protected raw HTML if text or child structure would be lost.                   |

Inline mapping should use a mark stack. When the walker enters `strong`, `em`, `del`, `mark`, `a`, or inline `code`, it pushes the matching mark. Text nodes become text runs with the active mark stack.

## Markdown Export Mapping Logic

When exporting the rich model back to markdown, prefer stable Obsidian syntax over preserving every original spelling:

- Frontmatter exports from the preserved `frontmatter` string unless the user edits properties later.
- Headings export as ATX headings with `#` through `######`.
- Paragraphs export as plain text with inline markdown marks.
- Bold exports as `**text**`.
- Italic exports as `*text*`.
- Strikethrough exports as `~~text~~`.
- Highlight exports as `==text==`.
- Inline code exports with backtick fencing long enough to contain the text.
- Code blocks export using preserved fence metadata when available; otherwise use triple backticks.
- Task items export as `- [ ]` or `- [x]`.
- Ordered and unordered lists export from the normalized list model.
- Callouts export as `> [!type] title`, with `+` or `-` fold markers when present.
- Wikilinks and embeds export from source link facts when the imported link still maps to the same target.
- Unknown raw markdown blocks export exactly from their protected source.
- Unknown raw HTML blocks export sanitized preserved HTML only when no original markdown range exists.

## Reconciliation Rules

- Trust rendered HTML for visible structure and nesting.
- Trust markdown source facts for hidden, exact, or syntax-only data.
- Prefer preserving user-authored markdown ranges when no Libre model edit touched that range.
- Once a user edits a block in Libre Note Editor, export that block from the normalized model.
- Never silently drop rendered text, source markdown, link targets, code text, or frontmatter.
- If rendered HTML and source facts disagree, keep the rendered visible content and attach the source fact as protected metadata for export review.

## Tests

- Unit test DOM cleanup with pasted preview HTML fragments.
- Unit test block mapping for headings, paragraphs, horizontal rules, lists, nested lists, and task lists.
- Unit test inline mapping for bold, italic, strikethrough, highlight, inline code, links, and nested marks.
- Unit test callout mapping for type, title, folded state, and nested content.
- Unit test code block mapping ignores syntax-highlight spans and copy buttons.
- Unit test frontmatter is taken from source markdown, not rendered metadata UI.
- Unit test unknown rendered elements become protected raw blocks.
- Keep snapshot coverage for representative rendered HTML fixtures.

## Runtime Verification

- Verify Obsidian is running in debug mode on port `9222`.
- Start the plugin with `npm run dev`.
- Reload the plugin by disabling and enabling it.
- Open notes containing:
  - frontmatter
  - headings
  - nested emphasis
  - highlights
  - inline code
  - fenced code
  - tasks
  - nested lists
  - callouts
  - tables
  - wikilinks
  - embeds
  - raw HTML
- Confirm Libre Note Editor imports the same visual structure users see in Obsidian preview.
- Confirm unsupported content is visible as protected raw content rather than silently lost.

## Edge Cases

- Full reading-view HTML pasted from DevTools includes title, metadata, preview sizer, and other UI wrappers.
- `MarkdownRenderer.render(...)` output may differ from a full note preview because reading view can include additional app chrome.
- Plugin post-processors may mutate rendered HTML after markdown is converted.
- HTML is sanitized by Obsidian, and markdown inside HTML elements is intentionally not rendered.
- Rendered HTML cannot preserve exact markdown choices such as `**bold**` versus `__bold__`.
- Rendered HTML cannot preserve exact blank lines, escaping, fence style, or source comments.
- Code blocks include syntax-highlight spans that must be flattened through `textContent`.
- Callout titles can contain nested rendered markdown.
- A list item can contain a heading or other block child.

## Done When

- Obsidian-rendered markdown imports into Libre Note Editor with better preview fidelity than a generic markdown converter.
- Frontmatter remains source-preserved and does not depend on rendered property UI.
- Common Obsidian Markdown fixtures import without dropped content.
- Unsupported or ambiguous rendered content is protected.
- Plan-specific tests pass.
- `npm run format:check`, `npm run lint`, and `npm run typecheck` pass.
