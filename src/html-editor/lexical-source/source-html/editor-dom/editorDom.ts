import {
  EDITOR_CALLOUT_ICON_ATTRIBUTE,
  READ_ONLY_PROTECTED_HTML_SELECTOR,
  TASK_CHECKBOX_COLOR_PROPERTY,
  TASK_LIST_ITEM_CHECKBOX_SELECTOR,
  TASK_LIST_ITEM_SELECTOR,
} from '../../../constants';

export function applyCalloutIconHooks(htmlDocument: Document): void {
  htmlDocument.querySelectorAll<HTMLElement>('.callout .callout-title').forEach((titleElement) => {
    titleElement.setAttribute(EDITOR_CALLOUT_ICON_ATTRIBUTE, 'true');
  });
}

export function removeCalloutIconHooks(htmlDocument: Document): void {
  htmlDocument
    .querySelectorAll<HTMLElement>(`[${EDITOR_CALLOUT_ICON_ATTRIBUTE}]`)
    .forEach((titleElement) => {
      titleElement.removeAttribute(EDITOR_CALLOUT_ICON_ATTRIBUTE);
    });
}

export function removeEmptyClassAttribute(element: HTMLElement): void {
  if (!element.getAttribute('class')) {
    element.removeAttribute('class');
  }
}

export function removeEmptyStyleAttribute(element: HTMLElement): void {
  if (!element.getAttribute('style')) {
    element.removeAttribute('style');
  }
}

export function isInsideProtectedContent(eventTarget: EventTarget | null): boolean {
  return (
    eventTarget instanceof Element &&
    eventTarget.closest(READ_ONLY_PROTECTED_HTML_SELECTOR) !== null
  );
}

export function isTaskCheckboxTarget(
  eventTarget: EventTarget | null
): eventTarget is HTMLInputElement {
  return (
    eventTarget instanceof HTMLInputElement && eventTarget.matches(TASK_LIST_ITEM_CHECKBOX_SELECTOR)
  );
}

export function removeTaskCheckboxColorHooks(htmlDocument: Document): void {
  htmlDocument
    .querySelectorAll<HTMLInputElement>(TASK_LIST_ITEM_CHECKBOX_SELECTOR)
    .forEach((checkboxElement) => {
      checkboxElement.style.removeProperty(TASK_CHECKBOX_COLOR_PROPERTY);
      removeEmptyStyleAttribute(checkboxElement);
    });
}

export function syncTaskCheckboxColorHooks(editorElement: HTMLElement): void {
  const editorTextColor = getComputedStyle(editorElement).color;

  editorElement
    .querySelectorAll<HTMLInputElement>(TASK_LIST_ITEM_CHECKBOX_SELECTOR)
    .forEach((checkboxElement) => {
      const taskListItemElement = checkboxElement.closest(TASK_LIST_ITEM_SELECTOR);
      const taskTextColor = getComputedStyle(taskListItemElement ?? checkboxElement).color;

      if (taskTextColor && taskTextColor !== editorTextColor) {
        checkboxElement.style.setProperty(TASK_CHECKBOX_COLOR_PROPERTY, taskTextColor);
      } else {
        checkboxElement.style.removeProperty(TASK_CHECKBOX_COLOR_PROPERTY);
      }
    });
}

export function updateTaskCheckboxState(
  eventTarget: EventTarget | null,
  nextCheckedState?: boolean
): HTMLElement | null {
  if (!isTaskCheckboxTarget(eventTarget)) {
    return null;
  }

  if (isInsideProtectedContent(eventTarget)) {
    eventTarget.checked = eventTarget.hasAttribute('checked');

    return null;
  }

  const checkedState = nextCheckedState ?? eventTarget.checked;
  eventTarget.checked = checkedState;

  if (checkedState) {
    eventTarget.setAttribute('checked', '');
  } else {
    eventTarget.removeAttribute('checked');
  }

  eventTarget.setAttribute('aria-checked', String(checkedState));

  const taskListItemElement = eventTarget.closest(TASK_LIST_ITEM_SELECTOR);
  taskListItemElement?.setAttribute('data-task', checkedState ? 'x' : ' ');

  return eventTarget.closest('[contenteditable="true"]');
}

export function toggleTaskCheckboxState(eventTarget: EventTarget | null): HTMLElement | null {
  if (!isTaskCheckboxTarget(eventTarget)) {
    return null;
  }

  return updateTaskCheckboxState(eventTarget, !eventTarget.checked);
}
