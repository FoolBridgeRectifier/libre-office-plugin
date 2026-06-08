# Obsidian Links Module

## What It Does

`obsidian-links` preserves Obsidian wiki links, embeds, tags, block ids, and heading/block target warnings across the rich HTML editing flow.

The module treats the Markdown mirror as the authoritative Obsidian link contract while allowing the rich editor to display rendered links.

## Main Components

- `helpers.ts` parses and creates wiki link source strings, reads inline/block Markdown from annotated HTML, derives default labels, and re-exports annotation.
- `interfaces.ts` defines wiki link parts, source facts, target cache shape, resolver interface, and warning shape.
- `constants.ts` defines `data-libre-*` attributes and selectors for internal links, embeds, and tags.
- `annotations/annotations.ts` writes original Markdown link, embed, tag, and block-id source onto rendered HTML; missing rendered facts are appended as source-preserving spans.
- `resolver/resolver.ts` adapts Obsidian metadata cache APIs into the generic link target resolver.
- `warnings/warnings.ts` collects link source strings from HTML and protected source facts, resolves heading/block targets, and reports missing heading or block ids.

## How It Is Used

`markdown-sync` annotates rendered Markdown through this module. `autosave` asks it to export annotated link elements back to Markdown. `editor-view` refreshes warning counts whenever Obsidian metadata changes.
