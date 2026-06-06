import { RibbonEditor } from './ribbon-editor/RibbonEditor';
import { createSkippedMobileRuntimeSetupState } from './office-runtime/helpers/setup-state/setupState';
import type { AppProps } from './interfaces';

export function App({
  activeFilePath = null,
  autosaveStatus = 'saved',
  desktopSourceStatus = 'idle',
  importedHtmlSource = null,
  isResolvingConflict = false,
  linkWarningCount = 0,
  officeRuntimeSetupState = createSkippedMobileRuntimeSetupState(),
  showHtmlEmptyState = activeFilePath === null,
  onEditorBlur,
  onHtmlSourceChange,
  onResolveConflict,
}: AppProps) {
  return (
    <RibbonEditor
      activeFilePath={activeFilePath}
      autosaveStatus={autosaveStatus}
      desktopSourceStatus={desktopSourceStatus}
      importedHtmlSource={importedHtmlSource}
      isResolvingConflict={isResolvingConflict}
      linkWarningCount={linkWarningCount}
      officeRuntimeSetupState={officeRuntimeSetupState}
      showHtmlEmptyState={showHtmlEmptyState}
      {...(onEditorBlur ? { onEditorBlur } : {})}
      {...(onHtmlSourceChange ? { onHtmlSourceChange } : {})}
      {...(onResolveConflict ? { onResolveConflict } : {})}
    />
  );
}
