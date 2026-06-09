import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CaretDown16Regular, CaretRight16Regular } from '@fluentui/react-icons';

import {
  EDITOR_CALLOUT_FOLD_CONTROL_ATTRIBUTE,
  EDITOR_CALLOUT_FOLD_CONTROL_CLASS_NAME,
} from '../../constants';
import {
  CALLOUT_FOLD_ICON_COLLAPSED_CLASS_NAME,
  CALLOUT_FOLD_ICON_EXPANDED_CLASS_NAME,
  CALLOUT_CONTENT_SELECTOR,
  CALLOUT_SELECTOR,
  FOLDED_CALLOUT_ATTRIBUTE_VALUE,
  NATIVE_CALLOUT_FOLD_SELECTOR,
} from './constants';

export function getFluentCaretIconMarkup(): string {
  const collapsedIcon = createElement(CaretRight16Regular, {
    'aria-hidden': true,
    className: CALLOUT_FOLD_ICON_COLLAPSED_CLASS_NAME,
  });

  const expandedIcon = createElement(CaretDown16Regular, {
    'aria-hidden': true,
    className: CALLOUT_FOLD_ICON_EXPANDED_CLASS_NAME,
  });

  return `${renderToStaticMarkup(collapsedIcon)}${renderToStaticMarkup(expandedIcon)}`;
}

export function createFoldControl(htmlDocument: Document): HTMLButtonElement {
  const foldControlElement = htmlDocument.createElement('button');

  foldControlElement.className = EDITOR_CALLOUT_FOLD_CONTROL_CLASS_NAME;
  foldControlElement.type = 'button';

  foldControlElement.setAttribute('aria-label', 'Toggle callout fold');
  foldControlElement.setAttribute('contenteditable', 'false');
  foldControlElement.setAttribute(EDITOR_CALLOUT_FOLD_CONTROL_ATTRIBUTE, 'true');
  foldControlElement.innerHTML = getFluentCaretIconMarkup();

  return foldControlElement;
}

export function isFoldedCallout(calloutElement: HTMLElement): boolean {
  return calloutElement.getAttribute('data-callout-fold') === FOLDED_CALLOUT_ATTRIBUTE_VALUE;
}

export function getCalloutFoldControlTarget(
  eventTarget: EventTarget | null
): HTMLButtonElement | null {
  if (!(eventTarget instanceof Element)) {
    return null;
  }

  return eventTarget.closest<HTMLButtonElement>(`.${EDITOR_CALLOUT_FOLD_CONTROL_CLASS_NAME}`);
}

export function getCalloutTarget(foldControlElement: HTMLElement): HTMLElement | null {
  return foldControlElement.closest<HTMLElement>(CALLOUT_SELECTOR);
}

export function syncFoldControlState(
  calloutElement: HTMLElement,
  foldControlElement: HTMLElement
): void {
  const expandedState = !isFoldedCallout(calloutElement);
  const contentElement = calloutElement.querySelector<HTMLElement>(CALLOUT_CONTENT_SELECTOR);
  const nativeFoldElement = calloutElement.querySelector<HTMLElement>(NATIVE_CALLOUT_FOLD_SELECTOR);

  foldControlElement.setAttribute('aria-expanded', String(expandedState));
  calloutElement.classList.toggle('is-collapsed', !expandedState);
  calloutElement.toggleAttribute('data-libre-callout-folded', !expandedState);
  nativeFoldElement?.classList.toggle('is-collapsed', !expandedState);

  if (expandedState) {
    contentElement?.style.removeProperty('display');
  } else {
    contentElement?.style.setProperty('display', 'none');
  }
}
