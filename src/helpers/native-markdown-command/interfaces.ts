import type { Plugin, TFile, WorkspaceLeaf } from 'obsidian';

export interface NativeMarkdownCommandTarget {
  readonly app: {
    readonly workspace: {
      getActiveFile(): TFile | null;
      getLeaf(newLeaf?: boolean): WorkspaceLeaf;
    };
  };
  addCommand(command: Parameters<Plugin['addCommand']>[0]): void;
}

export interface NativeMarkdownCommandOptions {
  readonly nativeFallbackLeaves: WeakSet<WorkspaceLeaf>;
  readonly target: NativeMarkdownCommandTarget;
}
