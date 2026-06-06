import type { StatusFooterProps } from './interfaces';

export function StatusFooter({
  activeFilePath,
  filePathClassName,
  htmlSourceStatusText,
  linkWarningStatusText,
  officeRuntimeSetupState,
  statusClassName,
}: StatusFooterProps) {
  return (
    <footer className={statusClassName}>
      <span aria-label="HTML source status">{htmlSourceStatusText}</span>
      <span aria-label="LibreOffice runtime status">{officeRuntimeSetupState.message}</span>
      <span aria-label="Obsidian link warnings">{linkWarningStatusText}</span>
      <span aria-label="Active markdown file" className={filePathClassName}>
        {activeFilePath ?? 'No markdown file loaded yet.'}
      </span>
    </footer>
  );
}
