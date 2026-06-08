import classNames from 'classnames';

export function getTabButtonClassName(isActiveRibbonTab: boolean) {
  return classNames(
    'min-h-8 whitespace-nowrap px-4 font-sans text-[11px] font-medium transition-colors',
    'duration-150 ease-ribbon-fast motion-reduce:transition-none',
    'focus-visible:outline focus-visible:outline-2',
    'focus-visible:outline-offset-[-2px] focus-visible:outline-button-focus-ring',
    isActiveRibbonTab ? 'bg-ribbon-bg text-text-primary' : 'text-white hover:bg-ribbon-purple-mid'
  );
}
