import type { KeyboardEvent, MouseEvent } from 'react';

export interface TaskCheckboxInteractionOptions {
  readonly emitEditorChange: (editorElement: HTMLElement) => void;
}

export type TaskCheckboxKeyboardEvent = KeyboardEvent<HTMLDivElement>;
export type TaskCheckboxMouseEvent = MouseEvent<HTMLDivElement>;
export type TaskCheckboxInteractionEvent = TaskCheckboxKeyboardEvent | TaskCheckboxMouseEvent;
