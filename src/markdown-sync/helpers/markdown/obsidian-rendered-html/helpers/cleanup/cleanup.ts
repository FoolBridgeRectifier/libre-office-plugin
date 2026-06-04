import { CONTENT_ROOT_SELECTORS, GENERATED_UI_SELECTORS } from '../../constants';

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
  for (const generatedUiSelector of GENERATED_UI_SELECTORS) {
    for (const generatedUiElement of rootElement.querySelectorAll(generatedUiSelector)) {
      generatedUiElement.remove();
    }
  }
}

function shouldKeepHiddenElement(element: Element): boolean {
  return element.closest('.callout-content') !== null;
}

function removeHiddenElements(rootElement: HTMLElement): void {
  for (const hiddenElement of rootElement.querySelectorAll('[hidden], [aria-hidden="true"]')) {
    if (shouldKeepHiddenElement(hiddenElement)) {
      continue;
    }

    hiddenElement.remove();
  }

  for (const element of rootElement.querySelectorAll<HTMLElement>('[style*="display: none"]')) {
    if (shouldKeepHiddenElement(element)) {
      continue;
    }

    element.remove();
  }
}

export function cleanRenderedMarkdownElement(containerElement: HTMLElement): HTMLElement {
  const contentRootElement = findContentRoot(containerElement);
  const cleanedElement = contentRootElement.cloneNode(true) as HTMLElement;

  removeGeneratedUiElements(cleanedElement);
  removeHiddenElements(cleanedElement);

  return cleanedElement;
}
