export interface MarkdownSourceFact {
  readonly text: string;
  readonly type: MarkdownSourceFactType;
}

export type MarkdownSourceFactType =
  | 'block-id'
  | 'code-fence'
  | 'comment'
  | 'embed'
  | 'hard-break'
  | 'raw-html'
  | 'wikilink';

export interface MarkdownSourceFacts {
  readonly facts: ReadonlyArray<MarkdownSourceFact>;
}
