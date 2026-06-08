import {
  EDITOR_CONTAINED_MEDIA_CLASS_NAME,
  EDITOR_PROTECTED_ATTRIBUTE,
  EDITOR_PROTECTED_CLASS_NAME,
  PROTECTED_HTML_SELECTOR,
  REMOTE_ASSET_SOURCE_SELECTOR,
  REMOTE_LOADING_ELEMENT_SELECTOR,
} from './constants';
import { wrapTableForHorizontalScroll } from '../attachments/helpers/tables/helpers/structure/structure';
import { sanitizeHtmlFragmentSourceWithReport } from '../conversion/helpers';

function isRemoteUrl(value: string | null): boolean {
  if (!value) {
    return false;
  }

  return /^(?:https?:)?\/\//i.test(value.trim());
}

function removeRemoteLoadingElements(htmlDocument: Document): void {
  htmlDocument.querySelectorAll(REMOTE_LOADING_ELEMENT_SELECTOR).forEach((remoteLoadingElement) => {
    remoteLoadingElement.remove();
  });
}

function removeRemoteAssetAttributes(htmlDocument: Document): void {
  htmlDocument
    .querySelectorAll<HTMLElement>(REMOTE_ASSET_SOURCE_SELECTOR)
    .forEach((assetElement) => {
      if (isRemoteUrl(assetElement.getAttribute('src'))) {
        assetElement.removeAttribute('src');
      }

      if (isRemoteUrl(assetElement.getAttribute('srcset'))) {
        assetElement.removeAttribute('srcset');
      }
    });
}

function applyResponsiveMediaClasses(htmlDocument: Document): void {
  htmlDocument.querySelectorAll<HTMLImageElement>('img').forEach((imageElement) => {
    imageElement.classList.add(EDITOR_CONTAINED_MEDIA_CLASS_NAME);
  });
}

function applyResponsiveTableWrappers(htmlDocument: Document): void {
  htmlDocument.querySelectorAll<HTMLTableElement>('table').forEach(wrapTableForHorizontalScroll);
}

function protectUnsupportedContent(htmlDocument: Document): void {
  htmlDocument
    .querySelectorAll<HTMLElement>(PROTECTED_HTML_SELECTOR)
    .forEach((protectedElement) => {
      protectedElement.setAttribute('contenteditable', 'false');
      protectedElement.setAttribute(EDITOR_PROTECTED_ATTRIBUTE, 'true');
      protectedElement.classList.add(EDITOR_PROTECTED_CLASS_NAME);
    });
}

function removeEmptyClassAttribute(element: HTMLElement): void {
  if (!element.getAttribute('class')) {
    element.removeAttribute('class');
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

  editableDocument
    .querySelectorAll<HTMLElement>(`[${EDITOR_PROTECTED_ATTRIBUTE}]`)
    .forEach((protectedElement) => {
      protectedElement.removeAttribute('contenteditable');
      protectedElement.removeAttribute(EDITOR_PROTECTED_ATTRIBUTE);
      protectedElement.classList.remove(EDITOR_PROTECTED_CLASS_NAME);
      removeEmptyClassAttribute(protectedElement);
    });

  editableDocument
    .querySelectorAll<HTMLImageElement>(`.${EDITOR_CONTAINED_MEDIA_CLASS_NAME}`)
    .forEach((imageElement) => {
      imageElement.classList.remove(EDITOR_CONTAINED_MEDIA_CLASS_NAME);
      removeEmptyClassAttribute(imageElement);
    });

  return sanitizeHtmlFragmentSourceWithReport(editableDocument.body.innerHTML).htmlSource;
}

export function isInsideProtectedContent(eventTarget: EventTarget | null): boolean {
  return eventTarget instanceof Element && eventTarget.closest(PROTECTED_HTML_SELECTOR) !== null;
}
