export const BLOCK_ID_PATTERN = /(^|\s)\^([A-Za-z0-9][A-Za-z0-9_-]*)\b/g;
export const CALLOUT_LINE_PATTERN = /^((?:>\s*)+)\[!([A-Za-z][A-Za-z0-9_-]*)\]([+-]?)(.*)$/;
export const CODE_SPAN_PATTERN = /(`+)([\s\S]*?)\1/g;
export const CSS_HEX_COLOR_PATTERN = /^[0-9a-f]{3}(?:[0-9a-f]{3})?(?:[0-9a-f]{2})?$/i;

export const FENCE_PATTERN = /^\s*(`{3,}|~{3,})/;
export const OBSIDIAN_MARKDOWN_PLACEHOLDER_PREFIX = 'LIBRE_NOTE_EDITOR_OBSIDIAN_TOKEN_';
export const OBSIDIAN_MARKDOWN_PLACEHOLDER_SUFFIX = '_END';
export const TAG_PATTERN =
  /(^|[\s([{,;])#([A-Za-z][A-Za-z0-9_-]*(?:\/[A-Za-z0-9][A-Za-z0-9_-]*)*)/g;
export const WIKI_LINK_PATTERN = /(!?)\[\[([^\]\n]+)\]\]/g;
