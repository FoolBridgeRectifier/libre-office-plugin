import {
  EDITOR_CONTAINED_MEDIA_CLASS_NAME,
  EDITOR_LOCKED_ATTRIBUTE,
  EDITOR_LOCKED_CLASS_NAME,
  REMOTE_ASSET_SOURCE_SELECTOR,
  REMOTE_LOADING_ELEMENT_SELECTOR,
  SOURCE_PRESERVED_HTML_SELECTOR,
} from '../../constants';
import { wrapTableForHorizontalScroll } from '../../../attachments/tables/structure/structure';
import { sanitizeHtmlFragmentSourceWithReport } from '../../../conversion';

function isRemoteUrl(value: string | null): boolean {
  return value ? /^(?:https?:)?\/\//i.test(value.trim()) : false;
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

function lockSourcePreservedContent(htmlDocument: Document): void {
  htmlDocument
    .querySelectorAll<HTMLElement>(SOURCE_PRESERVED_HTML_SELECTOR)
    .forEach((lockedElement) => {
      lockedElement.setAttribute('contenteditable', 'false');
      lockedElement.setAttribute(EDITOR_LOCKED_ATTRIBUTE, 'true');
      lockedElement.classList.add(EDITOR_LOCKED_CLASS_NAME);
    });
}

function removeEmptyClassAttribute(element: HTMLElement): void {
  if (!element.getAttribute('class')) {
    element.removeAttribute('class');
  }
}

function unwrapLexicalTextElement(element: HTMLElement): void {
  element.replaceWith(...Array.from(element.childNodes));
}

function unwrapLexicalWhitespaceSpan(element: HTMLElement): void {
  const styleAttribute = element.getAttribute('style') ?? '';

  const isLexicalWhitespaceSpan =
    element.tagName.toLowerCase() === 'span' &&
    element.attributes.length === 1 &&
    styleAttribute.replace(/\s/g, '').toLowerCase() === 'white-space:pre-wrap;';

  if (isLexicalWhitespaceSpan) {
    unwrapLexicalTextElement(element);
  }
}

function removeLexicalEditorArtifacts(htmlDocument: Document): void {
  htmlDocument
    .querySelectorAll<HTMLElement>('[data-lexical-text]')
    .forEach(unwrapLexicalTextElement);

  htmlDocument.querySelectorAll<HTMLElement>('span[style]').forEach(unwrapLexicalWhitespaceSpan);

  htmlDocument.querySelectorAll<HTMLElement>('*').forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      if (attribute.name.startsWith('data-lexical-')) {
        element.removeAttribute(attribute.name);
      }
    });

    if (element.getAttribute('dir') === 'auto') {
      element.removeAttribute('dir');
    }
  });
}

function createEditorDocument(htmlSource: string): Document {
  const sanitizedHtmlSource = sanitizeHtmlFragmentSourceWithReport(htmlSource).htmlSource;
  const htmlDocument = new DOMParser().parseFromString(sanitizedHtmlSource, 'text/html');

  removeRemoteLoadingElements(htmlDocument);
  removeRemoteAssetAttributes(htmlDocument);

  applyResponsiveMediaClasses(htmlDocument);
  applyResponsiveTableWrappers(htmlDocument);
  lockSourcePreservedContent(htmlDocument);

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
  removeLexicalEditorArtifacts(editableDocument);

  editableDocument
    .querySelectorAll<HTMLElement>(`[${EDITOR_LOCKED_ATTRIBUTE}]`)
    .forEach((lockedElement) => {
      lockedElement.removeAttribute('contenteditable');
      lockedElement.removeAttribute(EDITOR_LOCKED_ATTRIBUTE);
      lockedElement.classList.remove(EDITOR_LOCKED_CLASS_NAME);
      removeEmptyClassAttribute(lockedElement);
    });

  editableDocument
    .querySelectorAll<HTMLImageElement>(`.${EDITOR_CONTAINED_MEDIA_CLASS_NAME}`)
    .forEach((imageElement) => {
      imageElement.classList.remove(EDITOR_CONTAINED_MEDIA_CLASS_NAME);
      removeEmptyClassAttribute(imageElement);
    });

  return sanitizeHtmlFragmentSourceWithReport(editableDocument.body.innerHTML).htmlSource;
}

export function isInsideLockedContent(eventTarget: EventTarget | null): boolean {
  return (
    eventTarget instanceof Element && eventTarget.closest(SOURCE_PRESERVED_HTML_SELECTOR) !== null
  );
}
