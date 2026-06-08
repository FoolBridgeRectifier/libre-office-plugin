import type { SerializedElementNode, SerializedLexicalNode, Spread } from 'lexical';

export interface HtmlElementAttribute {
  readonly name: string;
  readonly value: string;
}

export type SerializedHtmlElementNode = Spread<
  {
    readonly attributes: readonly HtmlElementAttribute[];
    readonly lockedHtmlSource: string | null;
    readonly tagName: string;
  },
  SerializedElementNode
>;

export type SerializedLockedHtmlNode = Spread<
  {
    readonly htmlSource: string;
  },
  SerializedLexicalNode
>;
