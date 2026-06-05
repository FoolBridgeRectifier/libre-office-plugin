import { RibbonEditor } from './ribbon-editor/RibbonEditor';
import type { AppProps } from './interfaces';

export function App({
  activeFilePath = null,
  autosaveStatus = 'saved',
  importedHtmlSource = null,
  linkWarningCount = 0,
  onEditorBlur,
  onHtmlSourceChange,
}: AppProps) {
  return (
    <RibbonEditor
      activeFilePath={activeFilePath}
      autosaveStatus={autosaveStatus}
      importedHtmlSource={importedHtmlSource}
      linkWarningCount={linkWarningCount}
      {...(onEditorBlur ? { onEditorBlur } : {})}
      {...(onHtmlSourceChange ? { onHtmlSourceChange } : {})}
    />
  );
}
