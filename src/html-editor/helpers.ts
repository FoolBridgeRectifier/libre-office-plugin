import {
  EDITOR_PROTECTED_ATTRIBUTE,
  EDITOR_PROTECTED_CLASS_NAME,
  PROTECTED_HTML_SELECTOR,
  REMOTE_ASSET_SOURCE_SELECTOR,
  REMOTE_LOADING_ELEMENT_SELECTOR,
} from './constants';

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
  const htmlDocument = new DOMParser().parseFromString(htmlSource, 'text/html');

  removeRemoteLoadingElements(htmlDocument);
  removeRemoteAssetAttributes(htmlDocument);
  protectUnsupportedContent(htmlDocument);

  return htmlDocument;
}

export function prepareHtmlForEditor(htmlSource: string): string {
  return createEditorDocument(htmlSource).body.innerHTML;
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

  return editableDocument.body.innerHTML;
}

export function isInsideProtectedContent(eventTarget: EventTarget | null): boolean {
  return eventTarget instanceof Element && eventTarget.closest(PROTECTED_HTML_SELECTOR) !== null;
}
