export interface MarkdownSourceFact {
  readonly text: string;
  readonly type: MarkdownSourceFactType;
}

export interface MarkdownSourceFactWithOffset extends MarkdownSourceFact {
  readonly sourceOffset: number;
}

export type MarkdownSourceFactType =
  | 'block-id'
  | 'callout'
  | 'code-fence'
  | 'comment'
  | 'embed'
  | 'hard-break'
  | 'inline-code'
  | 'raw-html'
  | 'tag'
  | 'wikilink';

export interface MarkdownSourceFacts {
  readonly facts: ReadonlyArray<MarkdownSourceFact>;
}

export interface SourceRange {
  readonly endOffset: number;
  readonly startOffset: number;
}
