import type { StatusFooterProps } from './interfaces';

export function StatusFooter({
  activeFilePath,
  activeEditorSource,
  editorMode,
  filePathClassName,
  htmlSourceStatusText,
  linkWarningStatusText,
  officeRuntimeSetupState,
  pageLayout,
  statusClassName,
}: StatusFooterProps) {
  return (
    <footer className={statusClassName}>
      <span aria-label="HTML source status">{htmlSourceStatusText}</span>
      <span aria-label="Active editor source">
        {activeEditorSource === 'desktop-odt' ? 'Desktop ODT source' : 'HTML fallback source'}
      </span>
      <span aria-label="Editor mode">{getEditorModeText(editorMode)}</span>
      <span aria-label="Editor layout">
        {pageLayout === 'pageless' ? 'Pageless layout' : 'Page width layout'}
      </span>
      <span aria-label="LibreOffice runtime status">{officeRuntimeSetupState.message}</span>
      <span aria-label="Obsidian link warnings">{linkWarningStatusText}</span>
      <span aria-label="Active markdown file" className={filePathClassName}>
        {activeFilePath ?? 'No markdown file loaded yet.'}
      </span>
    </footer>
  );
}

function getEditorModeText(editorMode: StatusFooterProps['editorMode']): string {
  switch (editorMode) {
    case 'desktop-odt':
      return 'Desktop ODT mode';
    case 'html-fallback':
      return 'HTML fallback mode';
    case 'automatic':
      return 'Automatic mode';
  }
}
