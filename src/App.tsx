import { RibbonEditor } from './ribbon-editor/RibbonEditor';
import type { AppProps } from './interfaces';

export function App({
  activeFilePath = null,
  autosaveStatus = 'saved',
  importedHtmlSource = null,
  onEditorBlur,
  onHtmlSourceChange,
}: AppProps) {
  return (
    <RibbonEditor
      activeFilePath={activeFilePath}
      autosaveStatus={autosaveStatus}
      importedHtmlSource={importedHtmlSource}
      {...(onEditorBlur ? { onEditorBlur } : {})}
      {...(onHtmlSourceChange ? { onHtmlSourceChange } : {})}
    />
  );
}
