import {
  EDITOR_CONTAINED_MEDIA_CLASS_NAME,
  EDITOR_PROTECTED_ATTRIBUTE,
  EDITOR_PROTECTED_CLASS_NAME,
  PROTECTED_HTML_SELECTOR,
  REMOTE_ASSET_SOURCE_SELECTOR,
  REMOTE_LOADING_ELEMENT_SELECTOR,
} from './constants';
import { TABLE_SCROLL_CONTAINER_CLASS } from '../attachments/constants';
import { sanitizeHtmlFragmentSourceWithReport } from '../conversion/helpers';

function isRemoteUrl(value: string | null): boolean {
  if (!value) {
    return false;
  }

  return /^(?:https?:)?\/\//i.test(value.trim());
}

function removeRemoteLoadingElements(htmlDocument: Document): void {
  for (const remoteLoadingElement of htmlDocument.querySelectorAll(
    REMOTE_LOADING_ELEMENT_SELECTOR
  )) {
    remoteLoadingElement.remove();
  }
}

function removeRemoteAssetAttributes(htmlDocument: Document): void {
  for (const assetElement of htmlDocument.querySelectorAll<HTMLElement>(
    REMOTE_ASSET_SOURCE_SELECTOR
  )) {
    if (isRemoteUrl(assetElement.getAttribute('src'))) {
      assetElement.removeAttribute('src');
    }

    if (isRemoteUrl(assetElement.getAttribute('srcset'))) {
      assetElement.removeAttribute('srcset');
    }
  }
}

function applyResponsiveMediaClasses(htmlDocument: Document): void {
  for (const imageElement of htmlDocument.querySelectorAll<HTMLImageElement>('img')) {
    imageElement.classList.add(EDITOR_CONTAINED_MEDIA_CLASS_NAME);
  }
}

function wrapTableForEditorScroll(tableElement: HTMLTableElement): void {
  if (tableElement.parentElement?.classList.contains('libre-table-scroll')) {
    return;
  }

  const wrapperElement = tableElement.ownerDocument.createElement('div');

  wrapperElement.className = TABLE_SCROLL_CONTAINER_CLASS;
  tableElement.replaceWith(wrapperElement);
  wrapperElement.append(tableElement);
}

function applyResponsiveTableWrappers(htmlDocument: Document): void {
  for (const tableElement of Array.from(htmlDocument.querySelectorAll('table'))) {
    wrapTableForEditorScroll(tableElement);
  }
}

function protectUnsupportedContent(htmlDocument: Document): void {
  for (const protectedElement of htmlDocument.querySelectorAll<HTMLElement>(
    PROTECTED_HTML_SELECTOR
  )) {
    protectedElement.setAttribute('contenteditable', 'false');
    protectedElement.setAttribute(EDITOR_PROTECTED_ATTRIBUTE, 'true');
    protectedElement.classList.add(EDITOR_PROTECTED_CLASS_NAME);
  }
}

function createEditorDocument(htmlSource: string): Document {
  const sanitizedHtmlSource = sanitizeHtmlFragmentSourceWithReport(htmlSource).htmlSource;
  const htmlDocument = new DOMParser().parseFromString(sanitizedHtmlSource, 'text/html');

  removeRemoteLoadingElements(htmlDocument);
  removeRemoteAssetAttributes(htmlDocument);

  applyResponsiveMediaClasses(htmlDocument);
  applyResponsiveTableWrappers(htmlDocument);
  protectUnsupportedContent(htmlDocument);

  return htmlDocument;
}

export function prepareHtmlForEditor(htmlSource: string): string {
  return createEditorDocument(htmlSource).body.innerHTML;
}

export function getHtmlSecurityWarningText(htmlSource: string): string | null {
  return sanitizeHtmlFragmentSourceWithReport(htmlSource).removedUnsafeContent
    ? 'Unsafe HTML was removed before editing.'
    : null;
}

export function readHtmlFromEditor(editorElement: HTMLElement): string {
  const editableDocument = new DOMParser().parseFromString(editorElement.innerHTML, 'text/html');

  for (const protectedElement of editableDocument.querySelectorAll<HTMLElement>(
    `[${EDITOR_PROTECTED_ATTRIBUTE}]`
  )) {
    protectedElement.removeAttribute('contenteditable');
    protectedElement.removeAttribute(EDITOR_PROTECTED_ATTRIBUTE);
    protectedElement.classList.remove(EDITOR_PROTECTED_CLASS_NAME);

    if (!protectedElement.getAttribute('class')) {
      protectedElement.removeAttribute('class');
    }
  }

  for (const imageElement of editableDocument.querySelectorAll<HTMLImageElement>(
    `.${EDITOR_CONTAINED_MEDIA_CLASS_NAME}`
  )) {
    imageElement.classList.remove(EDITOR_CONTAINED_MEDIA_CLASS_NAME);

    if (!imageElement.getAttribute('class')) {
      imageElement.removeAttribute('class');
    }
  }

  return sanitizeHtmlFragmentSourceWithReport(editableDocument.body.innerHTML).htmlSource;
}

export function isInsideProtectedContent(eventTarget: EventTarget | null): boolean {
  return eventTarget instanceof Element && eventTarget.closest(PROTECTED_HTML_SELECTOR) !== null;
}
