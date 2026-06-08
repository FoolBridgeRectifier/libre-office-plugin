import type { Workspace } from 'obsidian';

import { EditorView } from './editor-view/EditorView';
import { LIBRE_MARKDOWN_VIEW_TYPE } from './editor-view/constants';
import { shouldRoutePathToLibreEditor } from './editor-view';
import { ensureFirstMarkdownImport } from './markdown-sync/markdownSync';
import { renderMarkdownWithObsidian } from './markdown-sync';
import type { RichDocumentHtmlLoadOptions, RichDocumentMappingEventPlugin } from './interfaces';
import type { RichDocumentStore } from './rich-documents/interfaces';

export { saveRichDocumentHtml, syncMarkdownMirror } from './source-write/sourceWrite';
export { resolveRichDocumentConflict } from './conflicts';

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

export async function flushOpenLibreEditors(workspace: Workspace): Promise<void> {
  const flushPromises = workspace
    .getLeavesOfType(LIBRE_MARKDOWN_VIEW_TYPE)
    .map((workspaceLeaf) =>
      workspaceLeaf.view instanceof EditorView ? workspaceLeaf.view.flushPendingAutosave() : null
    )
    .filter((flushPromise): flushPromise is Promise<void> => flushPromise !== null);

  await Promise.all(flushPromises);
}
