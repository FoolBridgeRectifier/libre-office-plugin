import { DESKTOP_ONLY_SELECTOR, REMOVED_CONVERTED_HTML_SELECTOR } from '../../constants';

export function sanitizeConvertedHtmlSource(htmlSource: string): string {
  const htmlDocument = new DOMParser().parseFromString(htmlSource, 'text/html');

  htmlDocument.querySelectorAll(REMOVED_CONVERTED_HTML_SELECTOR).forEach((element) => {
    element.remove();
  });

  htmlDocument.querySelectorAll('*').forEach((element) => {
    removeExecutableAttributes(element);
  });

  protectRemoteImages(htmlDocument);
  markDesktopOnlyElements(htmlDocument);

  const articleElement = htmlDocument.querySelector('article');

  return articleElement
    ? articleElement.outerHTML
    : `<article>${htmlDocument.body.innerHTML}</article>`;
}

function removeExecutableAttributes(element: Element): void {
  Array.from(element.attributes).forEach((attribute) => {
    const attributeName = attribute.name.toLowerCase();
    const attributeValue = attribute.value.trim().toLowerCase();

    if (
      attributeName.startsWith('on') ||
      isExecutableAttributeValue(attributeValue) ||
      isUnsafeStyleAttribute(attributeName, attributeValue)
    ) {
      element.removeAttribute(attribute.name);
    }
  });
}

function isExecutableAttributeValue(attributeValue: string): boolean {
  return removeWhitespaceAndControlCharacters(attributeValue).startsWith('javascript:');
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
    attributeValue.includes('behavior:')
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

function protectRemoteImages(htmlDocument: Document): void {
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
  });

  htmlDocument.querySelectorAll('img[srcset]').forEach((element) => {
    element.removeAttribute('srcset');
  });
}

function isRemoteImageSource(imageSource: string): boolean {
  return imageSource.startsWith('http://') || imageSource.startsWith('https://');
}
