import type { Plugin } from 'obsidian';

import { shouldRoutePathToLibreEditor } from './editor-view/helpers';
import type { RichDocumentStore } from './rich-documents/interfaces';

export function registerRichDocumentMappingEvents(
  plugin: Plugin,
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
