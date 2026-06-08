import type {
  DOMConversionMap,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  LexicalUpdateJSON,
  NodeKey,
} from 'lexical';
import { ElementNode } from 'lexical';

import {
  HTML_ELEMENT_NODE_TYPE,
  IMPORTED_HTML_TAG_NAMES,
  LOCKED_HTML_PLACEHOLDER_ATTRIBUTE,
  VOID_HTML_TAG_NAMES,
} from './constants';
import {
  cloneHtmlElementAttributes,
  createHtmlElement,
  getHtmlElementAttributes,
  isInlineHtmlTagName,
} from './helpers';
import { $createLockedHtmlNode, LockedHtmlNode } from './locked-html/lockedHtml';
import type { HtmlElementAttribute, SerializedHtmlElementNode } from './interfaces';

export class HtmlElementNode extends ElementNode {
  __attributes: readonly HtmlElementAttribute[];
  __lockedHtmlSource: string | null;
  __tagName: string;

  static getType(): string {
    return HTML_ELEMENT_NODE_TYPE;
  }

  static clone(node: HtmlElementNode): HtmlElementNode {
    return new HtmlElementNode(
      node.__tagName,
      node.__attributes,
      node.__lockedHtmlSource,
      node.__key
    );
  }

  static importDOM(): DOMConversionMap | null {
    return Object.fromEntries(
      IMPORTED_HTML_TAG_NAMES.map((tagName) => [tagName, convertHtmlElement])
    );
  }

  static importJSON(serializedNode: SerializedHtmlElementNode): HtmlElementNode {
    return $createHtmlElementNode(
      serializedNode.tagName,
      serializedNode.attributes,
      serializedNode.lockedHtmlSource
    ).updateFromJSON(serializedNode);
  }

  constructor(
    tagName: string,
    attributes: readonly HtmlElementAttribute[],
    lockedHtmlSource: string | null,
    key?: NodeKey
  ) {
    super(key);
    this.__attributes = cloneHtmlElementAttributes(attributes);
    this.__lockedHtmlSource = lockedHtmlSource;
    this.__tagName = tagName;
  }

  createDOM(_config: EditorConfig, _editor: LexicalEditor): HTMLElement {
    return createHtmlElement(this.__tagName, this.__attributes, this.__lockedHtmlSource);
  }

  updateDOM(previousNode: HtmlElementNode): boolean {
    return (
      previousNode.__tagName !== this.__tagName ||
      previousNode.__lockedHtmlSource !== this.__lockedHtmlSource
    );
  }

  exportDOM(): DOMExportOutput {
    return {
      element: createHtmlElement(this.__tagName, this.__attributes, this.__lockedHtmlSource),
    };
  }

  exportJSON(): SerializedHtmlElementNode {
    return {
      ...super.exportJSON(),
      attributes: cloneHtmlElementAttributes(this.__attributes),
      lockedHtmlSource: this.__lockedHtmlSource,
      tagName: this.__tagName,
      type: HTML_ELEMENT_NODE_TYPE,
      version: 1,
    };
  }

  updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedHtmlElementNode>): this {
    super.updateFromJSON(serializedNode);
    return this;
  }

  isInline(): boolean {
    return isInlineHtmlTagName(this.__tagName);
  }

  canBeEmpty(): boolean {
    return true;
  }
}

export function $createHtmlElementNode(
  tagName: string,
  attributes: readonly HtmlElementAttribute[],
  lockedHtmlSource: string | null = null
): HtmlElementNode {
  return new HtmlElementNode(tagName, attributes, lockedHtmlSource);
}

function convertHtmlElement(element: HTMLElement) {
  const lockedHtmlSource =
    element.getAttribute(LOCKED_HTML_PLACEHOLDER_ATTRIBUTE) ??
    (VOID_HTML_TAG_NAMES.includes(element.tagName.toLowerCase()) ? element.outerHTML : null);

  return {
    conversion: () => ({
      node:
        lockedHtmlSource === null
          ? $createHtmlElementNode(element.tagName.toLowerCase(), getHtmlElementAttributes(element))
          : $createLockedHtmlNode(lockedHtmlSource),
    }),
    priority: 4 as const,
  };
}

export function $isHtmlElementNode(node: LexicalNode | null | undefined): node is HtmlElementNode {
  return node instanceof HtmlElementNode;
}

export { LockedHtmlNode };
