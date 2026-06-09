import {
  isInsideProtectedContent,
  isTaskCheckboxTarget,
  toggleTaskCheckboxState,
  updateTaskCheckboxState,
} from '../source-html';
import { TASK_CHECKBOX_ACTIVATION_KEYS } from './constants';
import type {
  TaskCheckboxInteractionOptions,
  TaskCheckboxInteractionEvent,
  TaskCheckboxKeyboardEvent,
  TaskCheckboxMouseEvent,
} from './interfaces';

function isTaskCheckboxActivationKey(keyName: string): boolean {
  return TASK_CHECKBOX_ACTIVATION_KEYS.some((activationKey) => activationKey === keyName);
}

function preventProtectedCheckboxChange(event: TaskCheckboxInteractionEvent): boolean {
  if (!isTaskCheckboxTarget(event.target) || !isInsideProtectedContent(event.target)) {
    return false;
  }

  updateTaskCheckboxState(event.target);
  event.preventDefault();
  event.stopPropagation();

  return true;
}

export function handleTaskCheckboxClick(
  event: TaskCheckboxMouseEvent,
  options: TaskCheckboxInteractionOptions
): void {
  if (preventProtectedCheckboxChange(event)) {
    return;
  }

  const editorElement = updateTaskCheckboxState(event.target);

  if (editorElement) {
    event.stopPropagation();
    options.emitEditorChange(editorElement);
  }
}

export function handleTaskCheckboxKeyDown(
  event: TaskCheckboxKeyboardEvent,
  options: TaskCheckboxInteractionOptions
): void {
  if (!isTaskCheckboxActivationKey(event.key)) {
    return;
  }

  if (preventProtectedCheckboxChange(event)) {
    return;
  }

  const editorElement = toggleTaskCheckboxState(event.target);

  if (editorElement) {
    event.preventDefault();
    event.stopPropagation();
    options.emitEditorChange(editorElement);
  }
}

export function handleTaskCheckboxMouseDown(event: TaskCheckboxMouseEvent): void {
  if (isTaskCheckboxTarget(event.target)) {
    event.preventDefault();
  }
}
