# Final Source Search Checklist

Use this checklist before release after the LibreOffice removal plans are merged.

## Current Product Paths

The following search must return no matches in current source, package metadata,
scripts, current behavior docs, or build output:

```sh
rg -n "LibreOffice|ODT|runtime|desktop source|desktop-source|prepare-runtime|runtime-pruning|office-runtime|desktop-odt" \
  SYSTEM_DESIGN.md package.json scripts src dist THIRD_PARTY_NOTICES.md
```

Allowed matches:

- Historical plans under `docs/implementation-plans/` only when the file is
  clearly marked obsolete.
- Removal-plan inventory and checklist docs that describe the migration itself.
- Test names or assertions that prove legacy data with old ODT fields normalizes
  into the HTML-only model.

## Build Output

After `npm run build`, `dist/` must contain only plugin deliverables:

- `main.js`
- `manifest.json`
- `THIRD_PARTY_NOTICES.md`

`dist/runtime/` must not exist.

## Live Obsidian Checks

Reload the plugin through Obsidian debug port `9222`, then verify:

- first Markdown import creates and opens HTML rich source
- existing HTML source opens without being replaced by Markdown import
- autosave writes sanitized HTML
- native Markdown fallback shows the synced Markdown mirror
- settings, ribbon, footer, and commands do not expose LibreOffice, ODT,
  desktop-source, or runtime status
- old plugin data containing ODT fields still opens through the HTML source
