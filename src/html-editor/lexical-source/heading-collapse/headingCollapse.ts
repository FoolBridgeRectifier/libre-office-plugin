import {
  HEADING_COLLAPSE_ACTIVATION_KEYS,
  HEADING_COLLAPSE_BUTTON_ATTRIBUTE,
  HEADING_COLLAPSE_COLLAPSED_ATTRIBUTE,
  HEADING_COLLAPSE_HEADING_ATTRIBUTE,
  HEADING_SELECTOR,
} from './constants';
import {
  createHeadingCollapseButton,
  getHeadingCaretIconMarkup,
  getHeadingCollapseButtonTarget,
  syncAllHeadingCollapseRanges,
  syncHeadingCollapseButtonState,
} from './helpers';
import type { HeadingCollapseKeyboardEvent, HeadingCollapseMouseEvent } from './interfaces';

function getEditorHookDocument(editorRoot: ParentNode): Document {
  if (editorRoot instanceof Document) {
    return editorRoot;
  }

  const ownerDocument = (editorRoot as Node).ownerDocument;

  if (!ownerDocument) {
    throw new Error('Expected editor hook root to belong to a document.');
  }

  return ownerDocument;
}

function ensureHeadingCollapseControl(htmlDocument: Document, headingElement: HTMLElement): void {
  headingElement.setAttribute(HEADING_COLLAPSE_HEADING_ATTRIBUTE, 'true');

  const buttonElement =
    headingElement.querySelector<HTMLButtonElement>(`[${HEADING_COLLAPSE_BUTTON_ATTRIBUTE}]`) ??
    createHeadingCollapseButton(htmlDocument);

  if (buttonElement.innerHTML.trim().length === 0) {
    buttonElement.innerHTML = getHeadingCaretIconMarkup();
  }

  headingElement.prepend(buttonElement);
  syncHeadingCollapseButtonState(headingElement, buttonElement);
}

export function applyHeadingCollapseEditorHooks(editorRoot: ParentNode): void {
  const htmlDocument = getEditorHookDocument(editorRoot);

  editorRoot
    .querySelectorAll<HTMLElement>(HEADING_SELECTOR)
    .forEach((headingElement) => ensureHeadingCollapseControl(htmlDocument, headingElement));
}

export function removeHeadingCollapseEditorHooks(htmlDocument: Document): void {
  htmlDocument
    .querySelectorAll<HTMLElement>(`[${HEADING_COLLAPSE_BUTTON_ATTRIBUTE}]`)
    .forEach((buttonElement) => {
      buttonElement.remove();
    });

  htmlDocument
    .querySelectorAll<HTMLElement>(
      `[${HEADING_COLLAPSE_HEADING_ATTRIBUTE}],[${HEADING_COLLAPSE_COLLAPSED_ATTRIBUTE}]`
    )
    .forEach((headingElement) => {
      headingElement.removeAttribute(HEADING_COLLAPSE_HEADING_ATTRIBUTE);
      headingElement.removeAttribute(HEADING_COLLAPSE_COLLAPSED_ATTRIBUTE);
    });

  syncAllHeadingCollapseRanges(htmlDocument);
}

function toggleHeadingCollapseState(eventTarget: EventTarget | null): HTMLElement | null {
  const buttonElement = getHeadingCollapseButtonTarget(eventTarget);
  const headingElement = buttonElement?.closest<HTMLElement>(HEADING_SELECTOR) ?? null;
  const editorElement = headingElement?.closest<HTMLElement>('[contenteditable="true"]') ?? null;

  if (!buttonElement || !headingElement || !editorElement) {
    return null;
  }

  headingElement.toggleAttribute(
    HEADING_COLLAPSE_COLLAPSED_ATTRIBUTE,
    !headingElement.hasAttribute(HEADING_COLLAPSE_COLLAPSED_ATTRIBUTE)
  );

  syncHeadingCollapseButtonState(headingElement, buttonElement);
  syncAllHeadingCollapseRanges(editorElement);

  return editorElement;
}

export function handleHeadingCollapseClick(event: HeadingCollapseMouseEvent): void {
  if (toggleHeadingCollapseState(event.target)) {
    event.preventDefault();
    event.stopPropagation();
  }
}

export function handleHeadingCollapseKeyDown(event: HeadingCollapseKeyboardEvent): void {
  if (!HEADING_COLLAPSE_ACTIVATION_KEYS.some((activationKey) => activationKey === event.key)) {
    return;
  }

  if (toggleHeadingCollapseState(event.target)) {
    event.preventDefault();
    event.stopPropagation();
  }
}

export function handleHeadingCollapseMouseDown(event: HeadingCollapseMouseEvent): void {
  if (getHeadingCollapseButtonTarget(event.target)) {
    event.preventDefault();
  }
}
