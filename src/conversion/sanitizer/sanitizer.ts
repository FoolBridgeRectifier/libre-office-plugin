import { DESKTOP_ONLY_SELECTOR, REMOVED_CONVERTED_HTML_SELECTOR } from '../constants';
import type { HtmlSanitizationResult } from '../interfaces';

export function sanitizeConvertedHtmlSource(htmlSource: string): string {
  return sanitizeConvertedHtmlSourceWithReport(htmlSource).htmlSource;
}

export function sanitizeConvertedHtmlSourceWithReport(htmlSource: string): HtmlSanitizationResult {
  return sanitizeHtmlSource(htmlSource, 'article');
}

export function sanitizeHtmlFragmentSourceWithReport(htmlSource: string): HtmlSanitizationResult {
  return sanitizeHtmlSource(htmlSource, 'fragment');
}

function sanitizeHtmlSource(
  htmlSource: string,
  outputKind: 'article' | 'fragment'
): HtmlSanitizationResult {
  const htmlDocument = new DOMParser().parseFromString(htmlSource, 'text/html');
  let removedUnsafeContent = false;

  htmlDocument.querySelectorAll(REMOVED_CONVERTED_HTML_SELECTOR).forEach((element) => {
    element.remove();
    removedUnsafeContent = true;
  });

  htmlDocument.querySelectorAll('*').forEach((element) => {
    removedUnsafeContent = removeExecutableAttributes(element) || removedUnsafeContent;
  });

  removedUnsafeContent = protectRemoteMediaSources(htmlDocument) || removedUnsafeContent;
  markDesktopOnlyElements(htmlDocument);

  const articleElement = htmlDocument.querySelector('article');

  const htmlResult =
    outputKind === 'fragment'
      ? htmlDocument.body.innerHTML
      : articleElement
        ? articleElement.outerHTML
        : `<article>${htmlDocument.body.innerHTML}</article>`;

  return {
    htmlSource: htmlResult,
    removedUnsafeContent,
  };
}

function removeExecutableAttributes(element: Element): boolean {
  let removedUnsafeContent = false;

  Array.from(element.attributes).forEach((attribute) => {
    const attributeName = attribute.name.toLowerCase();
    const attributeValue = attribute.value.trim().toLowerCase();

    if (
      attributeName.startsWith('on') ||
      isDangerousAttributeValue(attributeValue) ||
      isUnsafeStyleAttribute(attributeName, attributeValue)
    ) {
      element.removeAttribute(attribute.name);
      removedUnsafeContent = true;
    }
  });

  return removedUnsafeContent;
}

function isDangerousAttributeValue(attributeValue: string): boolean {
  const compactAttributeValue = removeWhitespaceAndControlCharacters(attributeValue);

  return /^(?:javascript|vbscript|data):/i.test(compactAttributeValue);
}

function removeWhitespaceAndControlCharacters(attributeValue: string): string {
  return Array.from(attributeValue)
    .filter((character) => character > ' ' && character !== '\u007f')
    .join('');
}

function isUnsafeStyleAttribute(attributeName: string, attributeValue: string): boolean {
  if (attributeName !== 'style') {
    return false;
  }

  return (
    attributeValue.includes('javascript:') ||
    attributeValue.includes('expression(') ||
    attributeValue.includes('behavior:') ||
    attributeValue.includes('url(')
  );
}

function markDesktopOnlyElements(htmlDocument: Document): void {
  htmlDocument.querySelectorAll(DESKTOP_ONLY_SELECTOR).forEach((element) => {
    if (!(element instanceof HTMLElement)) {
      return;
    }

    element.dataset.libreDesktopOnly = 'true';
    element.dataset.libreProtected = 'desktop-only';
    element.setAttribute('contenteditable', 'false');
  });
}

function protectRemoteMediaSources(htmlDocument: Document): boolean {
  let removedUnsafeContent = false;

  htmlDocument.querySelectorAll('img[src]').forEach((element) => {
    const imageSource = element.getAttribute('src') ?? '';

    if (!(element instanceof HTMLImageElement) || !isRemoteImageSource(imageSource)) {
      return;
    }

    element.dataset.libreRemoteImageSrc = imageSource;
    element.removeAttribute('src');

    element.dataset.libreDesktopOnly = 'true';
    element.dataset.libreProtected = 'desktop-only';
    element.setAttribute('contenteditable', 'false');
    removedUnsafeContent = true;
  });

  htmlDocument.querySelectorAll('audio[src],source[src],video[src]').forEach((element) => {
    if (!isRemoteImageSource(element.getAttribute('src') ?? '')) {
      return;
    }

    element.removeAttribute('src');
    removedUnsafeContent = true;
  });

  htmlDocument
    .querySelectorAll('audio[srcset],img[srcset],source[srcset],video[srcset]')
    .forEach((element) => {
      element.removeAttribute('srcset');
      removedUnsafeContent = true;
    });

  return removedUnsafeContent;
}

function isRemoteImageSource(imageSource: string): boolean {
  return imageSource.startsWith('http://') || imageSource.startsWith('https://');
}
