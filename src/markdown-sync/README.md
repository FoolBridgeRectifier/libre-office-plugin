# Markdown Sync Module

## What It Does

`markdown-sync` imports Markdown into rich HTML and records enough source facts to later export edited HTML back into a useful Markdown mirror.

The import path prefers Obsidian's own renderer, then annotates the rendered HTML with preserved source metadata for links, embeds, tags, code, callouts, raw Markdown, attachments, and tables.

## Main Components

- `markdownSync.ts` implements `ensureFirstMarkdownImport`. It skips import when HTML already exists, sanitizes existing or imported HTML, creates the rich-document folder, writes the initial HTML, snapshots source states, and updates the mapping.
- `interfaces.ts` defines Markdown renderer callbacks, import options/results, frontmatter split results, and Markdown-to-HTML results.
- `constants.ts` defines frontmatter delimiters, imported article markers, and the protected marker attribute.
- `markdown/markdown.ts` splits YAML frontmatter using `gray-matter`.
- `markdown/obsidian-rendered-html/obsidianRenderedHtml.ts` orchestrates Obsidian rendering, fallback rendering, source fact collection, link/attachment/table/structured annotations, frontmatter templates, and protected source-facts templates.
- `markdown/obsidian-rendered-html/chunks/chunks.ts` splits Markdown into renderable chunks when a whole body renders empty.
- `markdown/obsidian-rendered-html/cleanup/cleanup.ts` removes Obsidian-generated UI from rendered Markdown.
- `markdown/obsidian-rendered-html/mapper/mapper.ts` maps cleaned rendered DOM back to HTML and repairs a heading-emphasis edge case.
- `markdown/obsidian-rendered-html/remote-images/remoteImages.ts` masks remote Markdown image targets before rendering so the renderer does not fetch them.
- `markdown/source-facts/sourceFacts.ts` collects ordered source facts for Markdown constructs that rendered HTML may lose.
- `markdown/source-facts/callouts`, `code-fences`, and `inline-code` contain focused collectors for structured Markdown regions.
- `markdown/structured-blocks/structuredBlocks.ts` stores original Markdown source on code fences, callouts, inline code, and raw protected blocks.

## How It Is Used

`richDocumentWorkspace` calls `ensureFirstMarkdownImport` when a Markdown note first opens. `autosave` later uses structured source annotations and frontmatter splitting while regenerating the Markdown mirror from edited HTML.
