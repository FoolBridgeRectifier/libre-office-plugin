export interface ObsidianWikiLinkParts {
  readonly alias: string | null;
  readonly embedded: boolean;
  readonly target: string;
}

export interface ObsidianSourceFact {
  readonly text: string;
  readonly type: string;
}

export interface ObsidianLinkTargetCache {
  readonly blockIds: ReadonlyArray<string>;
  readonly headings: ReadonlyArray<string>;
}

export interface ObsidianLinkTargetResolver {
  resolveTarget(targetPath: string): ObsidianLinkTargetCache | null;
}

export interface ObsidianLinkWarning {
  readonly linkText: string;
  readonly targetNote: string;
  readonly targetValue: string;
  readonly type: 'missing-block-target' | 'missing-heading-target' | 'missing-note-target';
}
