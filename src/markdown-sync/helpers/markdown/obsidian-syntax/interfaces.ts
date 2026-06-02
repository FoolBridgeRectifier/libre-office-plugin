export type ObsidianMarkdownTokenKind =
  | 'obsidian-block-id'
  | 'obsidian-callout'
  | 'obsidian-embed'
  | 'obsidian-tag'
  | 'obsidian-wiki-link';

export interface MarkdownFenceState {
  readonly character: '`' | '~';
  readonly length: number;
}

export interface ObsidianMarkdownProtectionResult {
  readonly markdown: string;
  readonly tokens: readonly ObsidianMarkdownToken[];
}

export interface ObsidianMarkdownToken {
  readonly html: string;
  readonly placeholder: string;
}

export interface ObsidianLinkParts {
  readonly alias: string | null;
  readonly target: string;
}
