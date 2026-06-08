export const EDITOR_PROTECTED_ATTRIBUTE = 'data-libre-editor-protected';
export const EDITOR_PROTECTED_CLASS_NAME = 'libre-protected-html-block';
export const EDITOR_CONTAINED_MEDIA_CLASS_NAME = 'libre-contained-editor-media';
export const EDITABLE_PROTECTED_HTML_SELECTOR =
  '[data-libre-protected="code-fence"],[data-libre-protected="complex-table"]';
export const PROTECTED_HTML_SELECTOR = '[data-libre-protected]';
export const READ_ONLY_PROTECTED_HTML_SELECTOR =
  '[data-libre-protected]:not([data-libre-protected="code-fence"]):not([data-libre-protected="complex-table"])';
export const REMOTE_ASSET_SOURCE_SELECTOR = 'audio,img,source,video';
export const REMOTE_LOADING_ELEMENT_SELECTOR = 'embed,iframe,object,script,link[rel="stylesheet"]';

export const HTML_EDITOR_CLASS_NAME = [
  'libre-html-editor markdown-preview-view min-h-64 w-full min-w-0 max-w-full box-border',
  'overflow-x-hidden rounded-ribbon-sm bg-ribbon-bg p-0 font-sans text-text-primary',
  'outline-none [overflow-wrap:anywhere] focus-visible:outline focus-visible:outline-2',
  'focus-visible:outline-button-focus-ring',
  '[&_.libre-contained-editor-media]:h-auto [&_.libre-contained-editor-media]:max-w-full',
  '[&_.libre-contained-editor-media]:object-contain',
  '[&_.libre-protected-html-block]:max-w-full',
  '[&_.libre-protected-html-block]:overflow-x-auto',
  '[&_.libre-table-scroll]:max-w-full [&_.libre-table-scroll]:overflow-x-auto',
  '[&_pre]:max-w-full [&_pre]:overflow-x-auto',
].join(' ');

export const HTML_EDITOR_EMPTY_STATE_CLASS_NAME =
  'box-border min-h-64 w-full min-w-0 max-w-full rounded-ribbon-sm border border-dashed border-ribbon-border px-4 py-3 font-sans text-sm text-text-secondary';

export const HTML_EDITOR_BLANK_STATE_CLASS_NAME = 'box-border min-h-64 w-full min-w-0 max-w-full';

export const HTML_EDITOR_ERROR_CLASS_NAME =
  'box-border min-h-64 w-full min-w-0 max-w-full rounded-ribbon-sm border border-icon-red px-4 py-3 font-sans text-sm text-text-primary';

export const HTML_EDITOR_WARNING_CLASS_NAME =
  'rounded-ribbon-sm border border-icon-orange px-3 py-2 font-sans text-[12px] text-text-primary';
