import type { DOMConversionMap, DOMExportOutput, LexicalUpdateJSON, NodeKey } from 'lexical';
import { DecoratorNode } from 'lexical';

import { LOCKED_HTML_NODE_TYPE } from '../constants';
import { createHtmlElementFromSource } from './helpers';
import type { SerializedLockedHtmlNode } from '../interfaces';

export class LockedHtmlNode extends DecoratorNode<null> {
  __htmlSource: string;

  static getType(): string {
    return LOCKED_HTML_NODE_TYPE;
  }

  static clone(node: LockedHtmlNode): LockedHtmlNode {
    return new LockedHtmlNode(node.__htmlSource, node.__key);
  }

  static importDOM(): DOMConversionMap | null {
    return {};
  }

  static importJSON(serializedNode: SerializedLockedHtmlNode): LockedHtmlNode {
    return $createLockedHtmlNode(serializedNode.htmlSource).updateFromJSON(serializedNode);
  }

  constructor(htmlSource: string, key?: NodeKey) {
    super(key);
    this.__htmlSource = htmlSource;
  }

  createDOM(): HTMLElement {
    return createHtmlElementFromSource(this.__htmlSource);
  }

  updateDOM(previousNode: LockedHtmlNode): boolean {
    return previousNode.__htmlSource !== this.__htmlSource;
  }

  exportDOM(): DOMExportOutput {
    return { element: createHtmlElementFromSource(this.__htmlSource) };
  }

  exportJSON(): SerializedLockedHtmlNode {
    return {
      htmlSource: this.__htmlSource,
      type: LOCKED_HTML_NODE_TYPE,
      version: 1,
    };
  }

  updateFromJSON(_serializedNode: LexicalUpdateJSON<SerializedLockedHtmlNode>): this {
    return this;
  }

  decorate(): null {
    return null;
  }
}

export function $createLockedHtmlNode(htmlSource: string): LockedHtmlNode {
  return new LockedHtmlNode(htmlSource);
}
