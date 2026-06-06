import {
  OPEN_NATIVE_MARKDOWN_COMMAND_ID,
  OPEN_NATIVE_MARKDOWN_COMMAND_NAME,
} from '../../editor-view/constants';
import {
  openFileInNativeMarkdownView,
  shouldRouteFileToLibreEditor,
} from '../../editor-view/helpers';
import type { NativeMarkdownCommandOptions } from './interfaces';

export function registerNativeMarkdownFallbackCommand(options: NativeMarkdownCommandOptions): void {
  options.target.addCommand({
    checkCallback: (checking) => {
      const activeFile = options.target.app.workspace.getActiveFile();
      const navigationLeaf = options.target.app.workspace.getLeaf(false);
      const canOpenNativeMarkdown = shouldRouteFileToLibreEditor(activeFile);

      if (checking || !canOpenNativeMarkdown) {
        return canOpenNativeMarkdown;
      }

      options.nativeFallbackLeaves.add(navigationLeaf);
      void openFileInNativeMarkdownView(navigationLeaf, activeFile);

      return true;
    },
    id: OPEN_NATIVE_MARKDOWN_COMMAND_ID,
    name: OPEN_NATIVE_MARKDOWN_COMMAND_NAME,
  });
}
