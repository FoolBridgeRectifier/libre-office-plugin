import {
  OPEN_DESKTOP_ODT_COMMAND_ID,
  OPEN_DESKTOP_ODT_COMMAND_NAME,
} from '../../editor-view/constants';
import {
  createDefaultDesktopConversionRuntime,
  ensureDesktopOdtSource,
  openDesktopOdtSource,
} from '../../conversion/conversion';
import { shouldRouteFileToLibreEditor } from '../../editor-view/helpers';
import { loadRichDocumentHtmlForStore } from '../rich-html/richHtml';
import type { DesktopOdtCommandOptions, DesktopOdtOpenOptions } from './interfaces';

export function registerOpenDesktopOdtCommand(options: DesktopOdtCommandOptions): void {
  options.target.addCommand({
    checkCallback: (checking) => {
      const activeFile = options.target.app.workspace.getActiveFile();
      const canOpenDesktopOdt = shouldRouteFileToLibreEditor(activeFile);

      if (checking || !canOpenDesktopOdt) {
        return canOpenDesktopOdt;
      }

      const richDocumentStore = options.getRichDocumentStore();

      if (!richDocumentStore) {
        return true;
      }

      void openActiveFileInDesktopOdtEditor({
        file: activeFile,
        getOfficeRuntimeSetupState: options.getOfficeRuntimeSetupState,
        richDocumentStore,
        target: options.target,
      }).catch(() => undefined);

      return true;
    },
    id: OPEN_DESKTOP_ODT_COMMAND_ID,
    name: OPEN_DESKTOP_ODT_COMMAND_NAME,
  });
}

export async function openActiveFileInDesktopOdtEditor(
  options: DesktopOdtOpenOptions
): Promise<void> {
  await loadRichDocumentHtmlForStore(options.target.app, options.file, options.richDocumentStore);

  const mapping = await options.richDocumentStore.getOrCreateMapping(options.file.path);

  const runtime = await createDefaultDesktopConversionRuntime(options.getOfficeRuntimeSetupState());

  if (!runtime) {
    return;
  }

  await ensureDesktopOdtSource({
    mapping,
    richDocumentStore: options.richDocumentStore,
    runtime,
    vaultAdapter: options.target.app.vault.adapter,
  });

  await openDesktopOdtSource({
    mapping,
    richDocumentStore: options.richDocumentStore,
    runtime,
    vaultAdapter: options.target.app.vault.adapter,
  });
}
