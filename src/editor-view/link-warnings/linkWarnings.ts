import { EditorView } from '../EditorView';
import type { Plugin } from 'obsidian';

export function registerEditorViewLinkWarningRefresh(plugin: Plugin): void {
  plugin.registerEvent(
    plugin.app.metadataCache.on('changed', () => {
      plugin.app.workspace.iterateAllLeaves((workspaceLeaf) => {
        if (workspaceLeaf.view instanceof EditorView) {
          workspaceLeaf.view.refreshLinkWarnings();
        }
      });
    })
  );
}
