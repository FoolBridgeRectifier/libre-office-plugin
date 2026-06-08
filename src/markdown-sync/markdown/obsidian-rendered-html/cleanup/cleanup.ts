import {
  CONTENT_ROOT_SELECTORS,
  GENERATED_UI_SELECTORS,
  HIDDEN_GENERATED_UI_SELECTORS,
} from '../constants';

function findContentRoot(containerElement: HTMLElement): HTMLElement {
  for (const rootSelector of CONTENT_ROOT_SELECTORS) {
    const contentRootElement = containerElement.querySelector(rootSelector);

    if (contentRootElement instanceof HTMLElement) {
      return contentRootElement;
    }
  }

  return containerElement;
}

function removeGeneratedUiElements(rootElement: HTMLElement): void {
  GENERATED_UI_SELECTORS.forEach((generatedUiSelector) => {
    rootElement.querySelectorAll(generatedUiSelector).forEach((generatedUiElement) => {
      generatedUiElement.remove();
    });
  });
}

function shouldKeepHiddenElement(element: Element): boolean {
  return element.closest('.callout-content') !== null;
}

function removeHiddenElements(rootElement: HTMLElement): void {
  rootElement.querySelectorAll(HIDDEN_GENERATED_UI_SELECTORS).forEach((hiddenElement) => {
    if (shouldKeepHiddenElement(hiddenElement)) {
      return;
    }

    hiddenElement.remove();
  });
}

export function cleanRenderedMarkdownElement(containerElement: HTMLElement): HTMLElement {
  const contentRootElement = findContentRoot(containerElement);
  const cleanedElement = contentRootElement.cloneNode(true) as HTMLElement;

  removeGeneratedUiElements(cleanedElement);
  removeHiddenElements(cleanedElement);

  return cleanedElement;
}
