import { RibbonEditor } from './ribbon-editor/RibbonEditor';
import { createSkippedMobileRuntimeSetupState } from './office-runtime/helpers/setup-state/setupState';
import type { AppProps } from './interfaces';

export function App({
  activeFilePath = null,
  autosaveStatus = 'saved',
  importedHtmlSource = null,
  isResolvingConflict = false,
  linkWarningCount = 0,
  officeRuntimeSetupState = createSkippedMobileRuntimeSetupState(),
  onEditorBlur,
  onHtmlSourceChange,
  onResolveConflict,
}: AppProps) {
  return (
    <RibbonEditor
      activeFilePath={activeFilePath}
      autosaveStatus={autosaveStatus}
      importedHtmlSource={importedHtmlSource}
      isResolvingConflict={isResolvingConflict}
      linkWarningCount={linkWarningCount}
      officeRuntimeSetupState={officeRuntimeSetupState}
      {...(onEditorBlur ? { onEditorBlur } : {})}
      {...(onHtmlSourceChange ? { onHtmlSourceChange } : {})}
      {...(onResolveConflict ? { onResolveConflict } : {})}
    />
  );
}
