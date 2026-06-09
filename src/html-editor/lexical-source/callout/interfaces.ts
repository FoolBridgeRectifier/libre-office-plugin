import type { KeyboardEvent, MouseEvent } from 'react';

export interface CalloutFoldInteractionOptions {
  readonly emitEditorChange: (editorElement: HTMLElement) => void;
}

export type CalloutFoldKeyboardEvent = KeyboardEvent<HTMLDivElement>;
export type CalloutFoldMouseEvent = MouseEvent<HTMLDivElement>;
