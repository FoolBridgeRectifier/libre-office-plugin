export const BLOCK_ID_SOURCE_PATTERN = /(^|\s)\^([A-Za-z0-9][A-Za-z0-9_-]*)\b/g;
export const COMMENT_SOURCE_PATTERN = /%%[\s\S]*?%%/g;
export const FENCE_SOURCE_PATTERN = /^\s*(`{3,}|~{3,})(.*)$/;
export const HARD_BREAK_SOURCE_PATTERN = /( {2,}|\\)\n/g;
export const RAW_HTML_SOURCE_PATTERN = /<\/?[A-Za-z][^>\n]*>/g;
export const TAG_SOURCE_PATTERN = /(^|[\s([{"'>])#([A-Za-z][A-Za-z0-9_-]*(?:\/[A-Za-z0-9_-]+)*)\b/g;
export const WIKI_LINK_SOURCE_PATTERN = /(!?)\[\[([^\]\n]+)\]\]/g;
