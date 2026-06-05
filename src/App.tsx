import { RibbonEditor } from './ribbon-editor/RibbonEditor';
import type { AppProps } from './interfaces';

export function App({
  activeFilePath = null,
  autosaveStatus = 'saved',
  importedHtmlSource = null,
  isResolvingConflict = false,
  linkWarningCount = 0,
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
      {...(onEditorBlur ? { onEditorBlur } : {})}
      {...(onHtmlSourceChange ? { onHtmlSourceChange } : {})}
      {...(onResolveConflict ? { onResolveConflict } : {})}
    />
  );
}
