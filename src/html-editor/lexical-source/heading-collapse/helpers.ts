import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CaretDown16Filled, CaretRight16Filled } from '@fluentui/react-icons';
import classNames from 'classnames';

import {
  HEADING_COLLAPSE_BUTTON_ATTRIBUTE,
  HEADING_COLLAPSE_BUTTON_CLASS_NAME,
  HEADING_COLLAPSE_BUTTON_STYLE_CLASS_NAME,
  HEADING_COLLAPSE_COLLAPSED_ATTRIBUTE,
  HEADING_COLLAPSE_HIDDEN_ATTRIBUTE,
  HEADING_COLLAPSE_HIDDEN_CLASS_NAME,
  HEADING_COLLAPSE_ICON_COLLAPSED_CLASS_NAME,
  HEADING_COLLAPSE_ICON_EXPANDED_CLASS_NAME,
  HEADING_BLOCK_SELECTOR,
  HEADING_SELECTOR,
} from './constants';

export function getHeadingLevel(headingElement: HTMLElement): number {
  return Number(headingElement.tagName.slice(1));
}

function getHeadingBlockElement(headingElement: HTMLElement): HTMLElement {
  const parentElement = headingElement.parentElement;

  return parentElement?.matches(HEADING_BLOCK_SELECTOR) ? parentElement : headingElement;
}

function getBlockHeadingElement(blockElement: Element): HTMLElement | null {
  if (blockElement.matches(HEADING_SELECTOR)) {
    return blockElement as HTMLElement;
  }

  return blockElement.querySelector<HTMLElement>(`:scope > ${HEADING_SELECTOR}`);
}

export function getHeadingCollapseButtonTarget(
  eventTarget: EventTarget | null
): HTMLButtonElement | null {
  return eventTarget instanceof Element
    ? eventTarget.closest<HTMLButtonElement>(`.${HEADING_COLLAPSE_BUTTON_CLASS_NAME}`)
    : null;
}

export function createHeadingCollapseButton(htmlDocument: Document): HTMLButtonElement {
  const buttonElement = htmlDocument.createElement('button');

  buttonElement.setAttribute(HEADING_COLLAPSE_BUTTON_ATTRIBUTE, 'true');
  buttonElement.setAttribute('aria-label', 'Toggle heading collapse');

  buttonElement.className = classNames(
    HEADING_COLLAPSE_BUTTON_CLASS_NAME,
    HEADING_COLLAPSE_BUTTON_STYLE_CLASS_NAME
  );

  buttonElement.contentEditable = 'false';

  buttonElement.type = 'button';

  return buttonElement;
}

export function getHeadingCaretIconMarkup(): string {
  const collapsedIcon = createElement(CaretRight16Filled, {
    'aria-hidden': true,
    className: HEADING_COLLAPSE_ICON_COLLAPSED_CLASS_NAME,
  });

  const expandedIcon = createElement(CaretDown16Filled, {
    'aria-hidden': true,
    className: HEADING_COLLAPSE_ICON_EXPANDED_CLASS_NAME,
  });

  return `${renderToStaticMarkup(collapsedIcon)}${renderToStaticMarkup(expandedIcon)}`;
}

export function getHeadingRange(headingElement: HTMLElement): HTMLElement[] {
  const headingLevel = getHeadingLevel(headingElement);
  const headingSiblings: HTMLElement[] = [];
  const headingBlockElement = getHeadingBlockElement(headingElement);
  let siblingElement = headingBlockElement.nextElementSibling;

  while (siblingElement instanceof HTMLElement) {
    const siblingHeadingElement = getBlockHeadingElement(siblingElement);

    if (siblingHeadingElement && getHeadingLevel(siblingHeadingElement) <= headingLevel) {
      break;
    }

    headingSiblings.push(siblingElement);
    siblingElement = siblingElement.nextElementSibling;
  }

  return headingSiblings;
}

export function syncHeadingCollapseButtonState(
  headingElement: HTMLElement,
  buttonElement: HTMLButtonElement
): void {
  const expandedState = !headingElement.hasAttribute(HEADING_COLLAPSE_COLLAPSED_ATTRIBUTE);

  buttonElement.setAttribute('aria-expanded', String(expandedState));
}

export function syncAllHeadingCollapseRanges(editorElement: ParentNode): void {
  editorElement
    .querySelectorAll<HTMLElement>(`[${HEADING_COLLAPSE_HIDDEN_ATTRIBUTE}]`)
    .forEach((hiddenElement) => {
      hiddenElement.removeAttribute(HEADING_COLLAPSE_HIDDEN_ATTRIBUTE);
      hiddenElement.classList.remove(HEADING_COLLAPSE_HIDDEN_CLASS_NAME);

      if (!hiddenElement.getAttribute('class')) {
        hiddenElement.removeAttribute('class');
      }
    });

  editorElement
    .querySelectorAll<HTMLElement>(
      `:is(${HEADING_SELECTOR})[${HEADING_COLLAPSE_COLLAPSED_ATTRIBUTE}]`
    )
    .forEach((headingElement) => {
      getHeadingRange(headingElement).forEach((collapsedSiblingElement) => {
        collapsedSiblingElement.setAttribute(HEADING_COLLAPSE_HIDDEN_ATTRIBUTE, 'true');
        collapsedSiblingElement.classList.add(HEADING_COLLAPSE_HIDDEN_CLASS_NAME);
      });
    });
}
