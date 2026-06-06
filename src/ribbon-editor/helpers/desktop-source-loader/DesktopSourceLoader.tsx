import classNames from 'classnames';

import type { DesktopSourceLoaderProps } from './interfaces';

export function DesktopSourceLoader({ status }: DesktopSourceLoaderProps) {
  if (status === 'idle') {
    return null;
  }

  const loaderClassName = classNames(
    'absolute right-3 top-3 flex items-center gap-1 rounded-ribbon-sm border bg-ribbon-bg',
    'px-2 py-1 font-sans text-[10px] font-medium shadow-ribbon-raised',
    status === 'error'
      ? 'border-icon-red text-icon-red'
      : 'border-ribbon-border text-text-secondary'
  );

  const spinnerClassName = classNames(
    'size-3 rounded-full border border-ribbon-border',
    status === 'loading'
      ? 'animate-spin border-t-icon-purple motion-reduce:animate-none'
      : 'border-icon-red'
  );

  return (
    <div
      aria-label={status === 'error' ? 'ODT source error' : 'ODT source loading'}
      className={loaderClassName}
    >
      <span aria-hidden="true" className={spinnerClassName} />
      <span>{status === 'error' ? 'ODT error' : 'ODT'}</span>
    </div>
  );
}
