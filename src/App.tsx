import { RibbonEditor } from './ribbon-editor/RibbonEditor';
import type { AppProperties } from './interfaces';

export function App({ activeFilePath = null }: AppProperties) {
  return <RibbonEditor activeFilePath={activeFilePath} />;
}
