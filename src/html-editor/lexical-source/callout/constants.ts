export const CALLOUT_SELECTOR = '.callout[data-callout]';
export const CALLOUT_TITLE_SELECTOR = ':scope > .callout-title';
export const CALLOUT_TITLE_INNER_SELECTOR = ':scope > .callout-title-inner';
export const CALLOUT_CONTENT_SELECTOR = ':scope > .callout-content';
export const NATIVE_CALLOUT_FOLD_SELECTOR = ':scope > .callout-title > .callout-fold';
export const CALLOUT_FOLD_ACTIVATION_KEYS = [' ', 'Enter'] as const;
export const CALLOUT_FOLD_ICON_COLLAPSED_CLASS_NAME = 'libre-callout-fold-icon-collapsed';
export const CALLOUT_FOLD_ICON_EXPANDED_CLASS_NAME = 'libre-callout-fold-icon-expanded';
export const CALLOUT_FOLD_CONTROL_STYLE_CLASS_NAME = [
  'appearance-none !border-0 !bg-transparent !shadow-none !text-inherit',
  'm-0 mt-0 !inline-grid !h-[20px] !min-h-[20px] !w-[20px] !min-w-[20px]',
  'flex-[0_0_20px] cursor-pointer place-content-center overflow-visible rounded-[6px] !p-0',
  'static !font-inherit !leading-none',
  'hover:!bg-transparent hover:!shadow-none active:!bg-transparent active:!shadow-none',
  'focus:!bg-transparent focus:!shadow-none focus-visible:outline focus-visible:outline-2',
  'focus-visible:outline-offset-1 focus-visible:outline-button-focus-ring',
].join(' ');
export const FOLDED_CALLOUT_ATTRIBUTE_VALUE = '-';
export const UNFOLDED_CALLOUT_ATTRIBUTE_VALUE = '+';
