import classNames from 'classnames';

export function getConflictRecoveryButtonClassName(isResolvingConflict: boolean): string {
  return classNames(
    'rounded-ribbon-sm border px-3 py-1.5 font-sans text-[11px] transition-colors',
    'duration-150 ease-ribbon-fast focus-visible:outline focus-visible:outline-2',
    'focus-visible:outline-offset-2 focus-visible:outline-button-focus-ring',
    isResolvingConflict
      ? 'border-ribbon-border text-text-disabled'
      : 'border-button-hover-border text-text-primary hover:bg-button-hover-bg'
  );
}
