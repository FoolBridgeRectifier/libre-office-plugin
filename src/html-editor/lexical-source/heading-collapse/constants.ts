export const HEADING_COLLAPSE_ACTIVATION_KEYS = ['Enter', ' '] as const;
export const HEADING_COLLAPSE_BUTTON_ATTRIBUTE = 'data-libre-heading-collapse-control';
export const HEADING_COLLAPSE_BUTTON_CLASS_NAME = 'libre-heading-collapse';
export const HEADING_COLLAPSE_BUTTON_STYLE_CLASS_NAME = [
  'appearance-none !border-0 !bg-transparent !shadow-none !text-inherit',
  'absolute start-[-22px] top-[0.35rem] z-[1] m-0 !inline-grid !h-[16px] !min-h-[16px]',
  '!w-[16px] !min-w-[16px] cursor-pointer place-content-center !p-0 opacity-0',
  'font-sans !text-[16px] !not-italic !leading-none transition-opacity duration-150',
  'ease-ribbon-fast motion-reduce:transition-none',
  'hover:!bg-transparent hover:!shadow-none active:!bg-transparent active:!shadow-none',
  'focus:!bg-transparent focus:!shadow-none focus-visible:outline focus-visible:outline-2',
  'focus-visible:outline-offset-1 focus-visible:outline-button-focus-ring',
  '[&_svg]:!block [&_svg]:!h-[16px] [&_svg]:!w-[16px] [&_svg]:!text-inherit',
].join(' ');
export const HEADING_COLLAPSE_COLLAPSED_ATTRIBUTE = 'data-libre-heading-collapsed';
export const HEADING_COLLAPSE_HIDDEN_ATTRIBUTE = 'data-libre-heading-collapse-hidden';
export const HEADING_COLLAPSE_HIDDEN_CLASS_NAME = 'libre-heading-collapse-hidden';
export const HEADING_COLLAPSE_HEADING_ATTRIBUTE = 'data-libre-heading-collapse-heading';
export const HEADING_COLLAPSE_ICON_COLLAPSED_CLASS_NAME = 'libre-heading-collapse-icon-collapsed';
export const HEADING_COLLAPSE_ICON_EXPANDED_CLASS_NAME = 'libre-heading-collapse-icon-expanded';
export const HEADING_BLOCK_SELECTOR = '.el-h1,.el-h2,.el-h3,.el-h4,.el-h5,.el-h6';
export const HEADING_SELECTOR = 'h1,h2,h3,h4,h5,h6';
