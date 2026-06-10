export const DESKTOP_ONLY_SELECTOR = [
  'header',
  'footer',
  '[class*="annotation" i]',
  '[class*="comment" i]',
  '[class*="tracked" i]',
  '[style*="page-break" i]',
].join(',');

export const REMOVED_HTML_SELECTOR = [
  'applet',
  'base',
  'embed',
  'iframe',
  'link',
  'meta',
  'object',
  'script',
  'style',
].join(',');
