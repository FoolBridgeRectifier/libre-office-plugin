import type { Workspace } from 'obsidian';

import { createMarkdownMirrorSource } from './autosave/helpers';
import { EditorView } from './editor-view/EditorView';
import { LIBRE_MARKDOWN_VIEW_TYPE } from './editor-view/constants';
import { shouldRoutePathToLibreEditor } from './editor-view/helpers';
import { ensureFirstMarkdownImport } from './markdown-sync/markdownSync';
import { renderMarkdownWithObsidian } from './markdown-sync/helpers';
import type {
  RichDocumentHtmlLoadOptions,
  RichDocumentHtmlSaveOptions,
  RichDocumentMappingEventPlugin,
  RichDocumentSourceWriteOptions,
} from './interfaces';
import type { RichDocumentStore, RichDocumentVaultAdapter } from './rich-documents/interfaces';

export function registerRichDocumentMappingEvents(
  plugin: RichDocumentMappingEventPlugin,
  richDocumentStore: RichDocumentStore
): void {
  plugin.registerEvent(
    plugin.app.vault.on('rename', (file, previousPath) => {
      if (shouldRoutePathToLibreEditor(file.path)) {
        void richDocumentStore.renameMapping(previousPath, file.path);
        return;
      }

      if (shouldRoutePathToLibreEditor(previousPath)) {
        void richDocumentStore.archiveMapping(previousPath);
      }
    })
  );

  plugin.registerEvent(
    plugin.app.vault.on('delete', (file) => {
      if (shouldRoutePathToLibreEditor(file.path)) {
        void richDocumentStore.deleteMapping(file.path);
      }
    })
  );
}

export async function saveRichDocumentHtml(options: RichDocumentHtmlSaveOptions): Promise<void> {
  const mapping = await options.richDocumentStore.getOrCreateMapping(options.markdownPath);

  if (
    await hasExternalHtmlChange(options.vaultAdapter, mapping.htmlPath, options.previousHtmlSource)
  ) {
    throw new Error('HTML source changed outside Libre Note Editor.');
  }

  const currentTimestamp = new Date().toISOString();

  await options.vaultAdapter.write(mapping.htmlPath, options.htmlSource);

  await options.richDocumentStore.updateMapping(options.markdownPath, {
    activeSource: 'html',
    syncTimestamps: {
      ...mapping.syncTimestamps,
      htmlSyncedAt: currentTimestamp,
      lastSyncedAt: currentTimestamp,
    },
  });
}

export async function loadRichDocumentHtml(
  options: RichDocumentHtmlLoadOptions
): Promise<string | null> {
  const mapping = await options.richDocumentStore.getOrCreateMapping(options.file.path);

  const importResult = await ensureFirstMarkdownImport({
    markdownRenderer: (bodyMarkdown, containerElement, sourcePath) =>
      renderMarkdownWithObsidian(options.app, bodyMarkdown, containerElement, sourcePath),
    markdownFile: options.file,
    mapping,
    richDocumentStore: options.richDocumentStore,
    vaultAdapter: options.app.vault.adapter,
    vaultReader: options.app.vault,
  });

  return importResult.htmlSource;
}

export async function syncMarkdownMirror(options: RichDocumentSourceWriteOptions): Promise<void> {
  const currentMarkdownSource = await options.vaultAdapter.read(options.markdownPath);

  const markdownMirrorSource = createMarkdownMirrorSource(
    currentMarkdownSource,
    options.htmlSource
  );

  await options.vaultAdapter.write(options.markdownPath, markdownMirrorSource);
  await updateMarkdownSyncTimestamp(options);
}

export async function flushOpenLibreEditors(workspace: Workspace): Promise<void> {
  const flushPromises = workspace
    .getLeavesOfType(LIBRE_MARKDOWN_VIEW_TYPE)
    .map((workspaceLeaf) =>
      workspaceLeaf.view instanceof EditorView ? workspaceLeaf.view.flushPendingAutosave() : null
    )
    .filter((flushPromise): flushPromise is Promise<void> => flushPromise !== null);

  await Promise.all(flushPromises);
}

async function updateMarkdownSyncTimestamp(options: RichDocumentSourceWriteOptions): Promise<void> {
  const mapping = await options.richDocumentStore.getOrCreateMapping(options.markdownPath);
  const currentTimestamp = new Date().toISOString();

  await options.richDocumentStore.updateMapping(options.markdownPath, {
    syncTimestamps: {
      ...mapping.syncTimestamps,
      lastSyncedAt: currentTimestamp,
      markdownSyncedAt: currentTimestamp,
    },
  });
}

async function hasExternalHtmlChange(
  vaultAdapter: RichDocumentVaultAdapter,
  htmlPath: string,
  previousHtmlSource: string
): Promise<boolean> {
  if (!(await vaultAdapter.exists(htmlPath))) {
    return false;
  }

  return (await vaultAdapter.read(htmlPath)) !== previousHtmlSource;
}
