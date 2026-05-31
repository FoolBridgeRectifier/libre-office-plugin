import { RibbonEditor } from './ribbon-editor/RibbonEditor';
import type { AppProps } from './interfaces';

export function App({ activeFilePath = null, importedHtmlSource = null }: AppProps) {
  return <RibbonEditor activeFilePath={activeFilePath} importedHtmlSource={importedHtmlSource} />;
}
