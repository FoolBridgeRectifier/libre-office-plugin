export const ACTIVATION_KEYS = ['Enter', ' '] as const;
export const EXTERNAL_LINK_SELECTOR = 'a[href]';
export const FOOTNOTE_LINK_SELECTOR =
  'a[href^="#"]:is(.footnote-link, .footnote-backref), sup.footnote-ref a[href^="#"]';
export const INTERNAL_LINK_SELECTOR =
  'a.internal-link[data-href], a[data-href][data-libre-obsidian-link-source]';
export const NAVIGATION_CODE_SELECTOR = 'code, pre';
export const SAFE_EXTERNAL_URL_PROTOCOLS = ['http:', 'https:', 'mailto:'] as const;
export const TAG_SELECTOR = 'a.tag[href^="#"], a[href^="#"][class~="tag"]';
