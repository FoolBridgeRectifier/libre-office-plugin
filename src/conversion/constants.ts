export const DEFAULT_CONVERSION_TIMEOUT_MS = 30000;
export const DEFAULT_OPEN_TIMEOUT_MS = 1000;
export const ODT_MIME_TYPE = 'application/vnd.oasis.opendocument.text';
export const ODT_PACKAGE_SIGNATURE = 'PK';
export const ODT_CONVERSION_HTML_FILE_NAME = 'document-conversion.html';
export const ODT_CONVERSION_OUTPUT_FILE_NAME = 'document-conversion.odt';

export const DESKTOP_ONLY_SELECTOR = [
  'header',
  'footer',
  '[class*="annotation" i]',
  '[class*="comment" i]',
  '[class*="tracked" i]',
  '[style*="page-break" i]',
].join(',');

export const REMOVED_CONVERTED_HTML_SELECTOR = [
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
