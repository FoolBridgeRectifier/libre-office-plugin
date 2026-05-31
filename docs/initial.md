# Libre Note Editor Implementation Plan

## 1. Product Rules

- Work offline only.
- Support desktop and mobile.
- Hide markdown editing while active.
- Restore markdown editing when disabled.
- Use a dual rich-source model.
- Use `.odt` for desktop rich editing.
- Use `.html` for mobile rich editing.
- Use `.md` as the Obsidian mirror.
- Keep Obsidian links working through markdown sync.
- Build rich editing first.
- Build the ribbon later.

## 2. Architecture

- Add a custom Obsidian markdown view.
- Register it as the default view for `.md` files.
- Route opened notes into Libre Note Editor.
- Keep the original `.md` file in place.
- Store rich files under `.libre-note-editor/documents/`.
- Store note mappings in plugin data.
- Track one active source per note.
- Desktop active source is `.odt`.
- Mobile active source is `.html`.
- Markdown is never the rich source of truth.
- Markdown is always the compatibility mirror.

## 3. File Model

- For each note, create:
  - `Note.md`
  - `.libre-note-editor/documents/<note-id>.odt`
  - `.libre-note-editor/documents/<note-id>.html`
- Add mapping data:
  - markdown path
  - rich document id
  - odt path
  - html path
  - active source
  - last markdown sync time
  - last odt sync time
  - last html sync time
  - last editor platform
  - conflict state
- Use stable note ids.
- Do not derive ids only from file names.
- Preserve mappings across renames.
- Update mappings on note rename.
- Delete or archive rich files on note delete.
- Recover mappings if plugin data is missing but rich files exist.

## 4. Desktop Editor

- Use local LibreOffice only.
- No remote Collabora.
- No cloud service.
- Detect local LibreOffice on startup.
- Prefer bundled or configured LibreOffice path.
- Fall back to system LibreOffice path.
- Show setup state if missing.
- Open `.odt` as the desktop active source.
- Save `.odt` automatically.
- Convert `.odt` to `.html` after desktop saves.
- Convert `.html` to `.md` after that.
- Keep advanced ODT formatting in `.odt`.
- Mark unsupported mobile formatting as desktop-only.

## 5. Mobile Editor

- Use a bundled open-source browser editor.
- Prefer CKEditor 5 GPL if project license allows GPL.
- Use Lexical if GPL is not acceptable.
- Bundle all editor code locally.
- Do not load CDN assets.
- Use pageless layout by default.
- Edit `.html` as the mobile active source.
- Save `.html` automatically.
- Convert `.html` to `.md`.
- Regenerate `.odt` later on desktop.
- Never require LibreOffice on mobile.

## 6. Pageless Mode

- Default to responsive pageless layout.
- No fixed paper canvas on mobile.
- Content width adapts to screen size.
- Tables scroll horizontally when needed.
- Images resize to container width.
- Preserve image source paths.
- Keep headings, links, lists, tables, and embeds readable.
- Page layout features are desktop-only for now.
- Headers, footers, page numbers, and margins are out of mobile scope.

## 7. Import Flow

- On first open, read the `.md` file.
- Parse YAML frontmatter separately.
- Convert markdown body to HTML.
- Convert HTML to ODT on desktop.
- Store both rich files.
- Set active source by platform.
- Preserve Obsidian wiki links as custom rich nodes.
- Preserve embeds as custom rich blocks.
- Preserve headings as real heading nodes.
- Preserve block ids as block metadata.
- Preserve tags as tag nodes.
- Preserve code blocks as code blocks.
- Preserve callouts as callout blocks.
- Preserve unknown markdown as protected raw blocks.

## 8. Save Flow

- Track dirty state from editor events.
- Autosave active rich source every 5 seconds.
- Sync markdown every 30 seconds.
- Save immediately on blur.
- Save immediately before closing a note.
- Save immediately before switching notes.
- Save immediately before plugin unload.
- Never depend on manual save.
- Show status:
  - saved
  - saving
  - syncing markdown
  - conflict
  - error
- Retry failed writes.
- Do not overwrite newer files blindly.

## 9. Sync Rules

- Only one rich source is active at a time.
- Desktop edits update `.odt`.
- Desktop save regenerates `.html`.
- Desktop save regenerates `.md`.
- Mobile edits update `.html`.
- Mobile save regenerates `.md`.
- Mobile does not regenerate `.odt`.
- Next desktop open regenerates `.odt` from `.html` if needed.
- Markdown edits outside the plugin trigger re-import checks.
- Newest valid source wins only when safe.
- Conflicts create copies.
- No data is discarded silently.

## 10. Obsidian Links

- Markdown mirror is the Obsidian link contract.
- Headings export as markdown headings.
- `h1` exports as `#`.
- `h2` exports as `##`.
- `h3` exports as `###`.
- Wiki links use custom rich nodes.
- Export wiki links as `[[Note]]`.
- Export heading links as `[[Note#Heading]]`.
- Export aliases as `[[Note|Alias]]`.
- Export heading aliases as `[[Note#Heading|Alias]]`.
- Web links export as `[text](url)`.
- Embeds export as `![[File]]`.
- Note embeds export as `![[Note]]`.
- Image embeds preserve vault paths.
- Tags export as `#tag`.
- Nested tags export as `#parent/child`.
- Block ids export as `^block-id`.
- Block links export as `[[Note#^block-id]]`.

## 11. Headings

- Generate heading anchors from visible heading text.
- Match Obsidian heading behavior as closely as possible.
- Preserve duplicate headings.
- Preserve heading case.
- Update markdown headings after rich edits.
- Preserve links to old headings when possible.
- Warn when a heading link target was renamed.
- Avoid generating empty headings.
- Convert empty rich headings to empty paragraphs.

## 12. Frontmatter

- Keep YAML frontmatter in `.md`.
- Do not show it as normal rich text in v1.
- Preserve frontmatter during markdown sync.
- Add a later properties panel.
- If frontmatter is invalid, preserve it as raw text.
- Never auto-delete frontmatter.
- Never reorder frontmatter keys in v1.

## 13. Callouts

- Parse Obsidian callouts from markdown.
- Render callouts as rich blocks.
- Preserve callout type.
- Preserve callout title.
- Preserve collapsed state.
- Preserve nested content.
- Export back to Obsidian callout syntax.
- Unknown callout types stay valid.

## 14. Code Blocks

- Preserve fenced code blocks.
- Preserve language names.
- Preserve code text exactly.
- Disable rich formatting inside code blocks.
- Export code blocks back to fenced markdown.
- Inline code stays inline code.
- Do not smart-format code content.

## 15. Tables

- Support basic tables in mobile editor.
- Support richer tables on desktop through ODT.
- Markdown mirror exports basic table syntax when possible.
- Complex tables export as HTML blocks in markdown.
- Preserve colspan and rowspan in HTML.
- Warn when markdown cannot represent a table exactly.
- Do not destroy complex desktop tables on mobile open.
- Render unsupported table features read-only on mobile when needed.

## 16. Images And Attachments

- Use Obsidian vault attachments.
- Store image references as vault-relative paths.
- Export image embeds as `![[image.png]]`.
- Preserve alt text where possible.
- Preserve captions in rich HTML.
- Convert unsupported captions to nearby text in markdown.
- Do not duplicate image files.
- Handle renamed image files through Obsidian metadata.
- Show broken attachment state if missing.

## 17. Conflict Handling

- Detect if `.md` changed externally.
- Detect if `.html` changed externally.
- Detect if `.odt` changed externally.
- Compare modified times and stored sync hashes.
- If only one source changed, sync forward.
- If two sources changed, create a conflict.
- Conflict files use timestamped names.
- Never auto-merge rich conflicts in v1.
- Show user choices:
  - keep desktop version
  - keep mobile version
  - keep markdown version
  - duplicate conflict copy
- Preserve all versions until resolved.

## 18. Conversion Edge Cases

- Unsupported markdown stays as raw protected blocks.
- Unsupported HTML stays in the rich source.
- Unsupported ODT formatting stays in `.odt`.
- Unsupported mobile formatting becomes read-only or simplified.
- Footnotes export to markdown footnotes when possible.
- Comments are desktop-only in v1.
- Track changes are desktop-only in v1.
- Page breaks are desktop-only in v1.
- Headers and footers are desktop-only in v1.
- Macros are ignored and never executed.
- Embedded scripts are stripped from HTML.
- Dangerous HTML attributes are removed.
- External remote images are preserved as links but not fetched.

## 19. Security

- Sanitize all imported HTML.
- Strip scripts.
- Strip inline event handlers.
- Block remote code execution.
- Do not execute macros.
- Do not load remote editor assets.
- Do not send note content over network.
- Keep conversion local.
- Use Obsidian vault APIs for file writes.
- Avoid raw filesystem writes unless required for LibreOffice.
- Validate all generated paths.
- Keep rich files inside `.libre-note-editor/documents/`.

## 20. Settings

- Add setting for LibreOffice path.
- Add setting for autosave interval.
- Add setting for markdown sync interval.
- Add setting for conflict behavior.
- Add setting for editor mode:
  - automatic
  - desktop LibreOffice
  - mobile HTML
  - HTML fallback
- Add setting for showing markdown source fallback.
- Default autosave interval is 5 seconds.
- Default markdown sync interval is 30 seconds.
- Default layout is pageless.
- Default mode is automatic.

## 21. Repo Implementation Order

- Repair missing `ribbon-editor` import first.
- Replace placeholder shell with real editor view.
- Add `editor-view`.
- Add `rich-documents`.
- Add `markdown-sync`.
- Add `obsidian-links`.
- Add `autosave`.
- Add `office-runtime`.
- Add `conversion`.
- Add `conflicts`.
- Add `settings`.
- Keep each feature folder within repo conventions.
- Keep files under 150 source lines.
- Use Tailwind only for styling.
- Import CSS only through `src/main.ts`.

## 22. Testing Plan

- Test plugin loads.
- Test `.md` opens rich view.
- Test first import creates `.html`.
- Test first desktop import creates `.odt`.
- Test mapping persists.
- Test note rename updates mapping.
- Test note delete archives rich files.
- Test autosave writes active source.
- Test markdown sync writes `.md`.
- Test blur forces save.
- Test close forces save.
- Test unload forces save.
- Test external markdown edit detection.
- Test conflict creation.
- Test heading links export.
- Test wiki links export.
- Test aliases export.
- Test block ids export.
- Test embeds export.
- Test tags export.
- Test frontmatter preservation.
- Test callout round-trip.
- Test code block exact preservation.
- Test table fallback.
- Test image path preservation.
- Test missing LibreOffice setup state.
- Test mobile HTML fallback.
- Test plugin disable restores markdown.
- Run `npm test`.
- Run `npm run format:check`.
- Run `npm run lint`.
- Run `npm run typecheck`.

## 23. Acceptance Criteria

- Opening a note shows rich editing.
- Markdown source is hidden by default.
- Disabling plugin restores markdown editing.
- Desktop can edit rich ODT source locally.
- Mobile can edit rich HTML source locally.
- Notes work with no internet.
- Obsidian backlinks still work.
- Obsidian graph still works.
- Heading links still work.
- Wiki links still work.
- Tags still work.
- Search still works through `.md`.
- Autosave works without manual save.
- Conflicts never lose data.
- Unsupported features degrade safely.
- Tests and checks pass.

## 24. Assumptions

- The plugin may use GPL-compatible editor code if CKEditor is chosen.
- If GPL is not acceptable, use Lexical instead.
- LibreOffice desktop runtime is local.
- Mobile does not run LibreOffice directly.
- Mobile uses HTML editor.
- `.odt` is desktop rich source.
- `.html` is mobile rich source.
- `.md` is Obsidian compatibility mirror.
- Pageless is default.
- Ribbon is out of scope for this implementation.
