import type { KeyboardEvent, MouseEvent } from 'react';

import type { EditorNavigationHandlers } from '../../../editor-navigation/interfaces';

export type NavigationKeyboardEvent = KeyboardEvent<HTMLDivElement>;
export type NavigationMouseEvent = MouseEvent<HTMLDivElement>;
export type NavigationInteractionOptions = EditorNavigationHandlers;

export interface NavigationHandlerInputs {
  readonly onExternalLinkNavigate?: ((url: string) => void) | undefined;
  readonly onInternalLinkNavigate?: ((target: string) => void) | undefined;
  readonly onTagNavigate?: ((tagText: string) => void) | undefined;
}
