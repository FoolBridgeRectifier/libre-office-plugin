import {
  EDITOR_CALLOUT_FOLD_CONTROL_ATTRIBUTE,
  EDITOR_CALLOUT_FOLD_CONTROL_CLASS_NAME,
  EDITOR_CALLOUT_ICON_ATTRIBUTE,
} from '../../constants';
import {
  CALLOUT_FOLD_ACTIVATION_KEYS,
  CALLOUT_SELECTOR,
  CALLOUT_TITLE_SELECTOR,
  CALLOUT_TITLE_INNER_SELECTOR,
  FOLDED_CALLOUT_ATTRIBUTE_VALUE,
  UNFOLDED_CALLOUT_ATTRIBUTE_VALUE,
} from './constants';
import {
  createFoldControl,
  getCalloutFoldControlTarget,
  getCalloutTarget,
  getFluentCaretIconMarkup,
  isFoldedCallout,
  syncFoldControlState,
} from './helpers';
import type {
  CalloutFoldInteractionOptions,
  CalloutFoldKeyboardEvent,
  CalloutFoldMouseEvent,
} from './interfaces';

function getEditorHookDocument(editorRoot: ParentNode): Document {
  return editorRoot instanceof Document ? editorRoot : (editorRoot as Node).ownerDocument!;
}

function ensureFoldControl(htmlDocument: Document, calloutElement: HTMLElement): void {
  if (!calloutElement.hasAttribute('data-callout-fold')) {
    return;
  }

  const titleElement = calloutElement.querySelector<HTMLElement>(CALLOUT_TITLE_SELECTOR);
  const titleInnerElement = titleElement?.querySelector<HTMLElement>(CALLOUT_TITLE_INNER_SELECTOR);

  if (!titleElement) {
    return;
  }

  const foldControlElement =
    titleElement.querySelector<HTMLButtonElement>(`.${EDITOR_CALLOUT_FOLD_CONTROL_CLASS_NAME}`) ??
    createFoldControl(htmlDocument);

  if (foldControlElement.innerHTML.trim().length === 0) {
    foldControlElement.innerHTML = getFluentCaretIconMarkup();
  }

  if (titleInnerElement) {
    titleInnerElement.after(foldControlElement);
  } else {
    titleElement.append(foldControlElement);
  }

  syncFoldControlState(calloutElement, foldControlElement);
}

export function applyCalloutEditorHooks(editorRoot: ParentNode): void {
  const htmlDocument = getEditorHookDocument(editorRoot);

  editorRoot.querySelectorAll<HTMLElement>('.callout .callout-title').forEach((titleElement) => {
    titleElement.setAttribute(EDITOR_CALLOUT_ICON_ATTRIBUTE, 'true');
  });

  editorRoot
    .querySelectorAll<HTMLElement>(CALLOUT_SELECTOR)
    .forEach((calloutElement) => ensureFoldControl(htmlDocument, calloutElement));
}

export function removeCalloutEditorHooks(htmlDocument: Document): void {
  htmlDocument
    .querySelectorAll<HTMLElement>(`[${EDITOR_CALLOUT_ICON_ATTRIBUTE}]`)
    .forEach((titleElement) => {
      titleElement.removeAttribute(EDITOR_CALLOUT_ICON_ATTRIBUTE);
    });

  htmlDocument
    .querySelectorAll<HTMLElement>(`[${EDITOR_CALLOUT_FOLD_CONTROL_ATTRIBUTE}]`)
    .forEach((foldControlElement) => {
      foldControlElement.remove();
    });

  htmlDocument.querySelectorAll<HTMLElement>('[data-libre-callout-folded]').forEach((element) => {
    element.removeAttribute('data-libre-callout-folded');
  });
}

export function toggleCalloutFoldState(eventTarget: EventTarget | null): HTMLElement | null {
  const foldControlElement = getCalloutFoldControlTarget(eventTarget);
  const calloutElement = foldControlElement ? getCalloutTarget(foldControlElement) : null;

  if (!foldControlElement || !calloutElement) {
    return null;
  }

  calloutElement.setAttribute(
    'data-callout-fold',
    isFoldedCallout(calloutElement)
      ? UNFOLDED_CALLOUT_ATTRIBUTE_VALUE
      : FOLDED_CALLOUT_ATTRIBUTE_VALUE
  );

  syncFoldControlState(calloutElement, foldControlElement);

  return foldControlElement.closest('[contenteditable="true"]');
}

export function handleCalloutFoldClick(
  event: CalloutFoldMouseEvent,
  options: CalloutFoldInteractionOptions
): void {
  const editorElement = toggleCalloutFoldState(event.target);

  if (editorElement) {
    event.preventDefault();
    event.stopPropagation();
    options.emitEditorChange(editorElement);
  }
}

export function handleCalloutFoldKeyDown(
  event: CalloutFoldKeyboardEvent,
  options: CalloutFoldInteractionOptions
): void {
  if (!CALLOUT_FOLD_ACTIVATION_KEYS.some((activationKey) => activationKey === event.key)) {
    return;
  }

  const editorElement = toggleCalloutFoldState(event.target);

  if (editorElement) {
    event.preventDefault();
    event.stopPropagation();
    options.emitEditorChange(editorElement);
  }
}

export function handleCalloutFoldMouseDown(event: CalloutFoldMouseEvent): void {
  if (getCalloutFoldControlTarget(event.target)) {
    event.preventDefault();
  }
}
