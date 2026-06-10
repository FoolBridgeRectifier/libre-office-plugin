import { RibbonEditor } from './ribbon-editor/RibbonEditor';
import type { AppProps } from './interfaces';

export function App({
  activeFilePath = null,
  autosaveStatus = 'saved',
  importedHtmlSource = null,
  isResolvingConflict = false,
  linkWarningCount = 0,
  pageLayout = 'pageless',
  showHtmlEmptyState = activeFilePath === null,
  onEditorBlur,
  onExternalLinkNavigate,
  onHtmlSourceChange,
  onInternalLinkNavigate,
  onResolveConflict,
  onTagNavigate,
}: AppProps) {
  return (
    <RibbonEditor
      activeFilePath={activeFilePath}
      autosaveStatus={autosaveStatus}
      importedHtmlSource={importedHtmlSource}
      isResolvingConflict={isResolvingConflict}
      linkWarningCount={linkWarningCount}
      pageLayout={pageLayout}
      showHtmlEmptyState={showHtmlEmptyState}
      {...(onEditorBlur ? { onEditorBlur } : {})}
      {...(onExternalLinkNavigate ? { onExternalLinkNavigate } : {})}
      {...(onHtmlSourceChange ? { onHtmlSourceChange } : {})}
      {...(onInternalLinkNavigate ? { onInternalLinkNavigate } : {})}
      {...(onResolveConflict ? { onResolveConflict } : {})}
      {...(onTagNavigate ? { onTagNavigate } : {})}
    />
  );
}
