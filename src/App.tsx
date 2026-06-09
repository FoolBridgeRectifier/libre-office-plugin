import { RibbonEditor } from './ribbon-editor/RibbonEditor';
import { createSkippedMobileRuntimeSetupState } from './office-runtime/setup-state/setupState';
import type { AppProps } from './interfaces';

export function App({
  activeFilePath = null,
  activeEditorSource = 'html-fallback',
  autosaveStatus = 'saved',
  desktopSourceStatus = 'idle',
  editorMode = 'automatic',
  importedHtmlSource = null,
  isResolvingConflict = false,
  linkWarningCount = 0,
  officeRuntimeSetupState = createSkippedMobileRuntimeSetupState(),
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
      activeEditorSource={activeEditorSource}
      autosaveStatus={autosaveStatus}
      desktopSourceStatus={desktopSourceStatus}
      editorMode={editorMode}
      importedHtmlSource={importedHtmlSource}
      isResolvingConflict={isResolvingConflict}
      linkWarningCount={linkWarningCount}
      officeRuntimeSetupState={officeRuntimeSetupState}
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
