import { INLINE_HTML_TAG_NAMES } from './constants';
import type { HtmlElementAttribute } from './interfaces';

export function cloneHtmlElementAttributes(
  attributes: readonly HtmlElementAttribute[]
): HtmlElementAttribute[] {
  return attributes.map((attribute) => ({
    name: attribute.name,
    value: attribute.value,
  }));
}

export function getHtmlElementAttributes(element: HTMLElement): HtmlElementAttribute[] {
  return Array.from(element.attributes).map((attribute) => ({
    name: attribute.name,
    value: attribute.value,
  }));
}

function createHtmlElementFromSource(htmlSource: string): HTMLElement {
  const htmlDocument = new DOMParser().parseFromString(htmlSource, 'text/html');
  const firstElement = htmlDocument.body.firstElementChild;

  return firstElement instanceof HTMLElement ? firstElement : document.createElement('div');
}

export function createHtmlElement(
  tagName: string,
  attributes: readonly HtmlElementAttribute[],
  lockedHtmlSource: string | null
): HTMLElement {
  const htmlElement =
    lockedHtmlSource === null
      ? document.createElement(tagName)
      : createHtmlElementFromSource(lockedHtmlSource);

  attributes.forEach((attribute) => {
    htmlElement.setAttribute(attribute.name, attribute.value);
  });

  return htmlElement;
}

export function isInlineHtmlTagName(tagName: string): boolean {
  return INLINE_HTML_TAG_NAMES.split(',').includes(tagName);
}
