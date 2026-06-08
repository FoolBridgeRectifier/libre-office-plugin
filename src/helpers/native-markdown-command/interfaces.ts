import type { Plugin, TFile, WorkspaceLeaf } from 'obsidian';

interface NativeMarkdownCommandTarget {
  readonly app: {
    readonly workspace: {
      getActiveFile(): TFile | null;
      getLeaf(newLeaf?: boolean): WorkspaceLeaf;
    };
  };
  addCommand(command: Parameters<Plugin['addCommand']>[0]): void;
}

export interface NativeMarkdownCommandOptions {
  readonly getIsFallbackVisible?: () => boolean;
  readonly nativeFallbackLeaves: WeakSet<WorkspaceLeaf>;
  readonly target: NativeMarkdownCommandTarget;
}
