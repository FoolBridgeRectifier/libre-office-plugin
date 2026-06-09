import type { KeyboardEvent, MouseEvent, MutableRefObject } from 'react';

import type { EditorNavigationHandlers } from '../../editor-navigation/interfaces';

export interface LexicalSourceProps extends EditorNavigationHandlers {
  readonly htmlSource: string;
  readonly onEditorBlur?: () => void;
  readonly onDirtyStateChange?: (isDirty: boolean) => void;
  readonly onHtmlSourceChange?: (htmlSource: string) => void;
  readonly onInitializationError?: (message: string) => void;
  readonly onSecurityWarningChange?: (warningText: string | null) => void;
}

export interface HtmlSourcePluginProps {
  readonly htmlSource: string;
  readonly initialHtmlSourceRef: MutableRefObject<string>;
  readonly isApplyingHtmlSourceRef: MutableRefObject<boolean>;
  readonly loadedHtmlSourceRef: MutableRefObject<string | null>;
  readonly onDirtyStateChange?: (isDirty: boolean) => void;
  readonly onHtmlSourceChange?: (htmlSource: string) => void;
  readonly onInitializationError?: (message: string) => void;
  readonly onSecurityWarningChange?: (warningText: string | null) => void;
}

export type EmitLexicalSourceChange = (editorElement: HTMLElement) => void;

export interface LexicalSourceInteractionInputs extends EditorNavigationHandlers {
  readonly emitEditorChange: EmitLexicalSourceChange;
  readonly skipNextClickNavigationUrlRef: MutableRefObject<string | null>;
}

export interface LexicalSourceInteractionHandlers {
  readonly onClickCapture: (event: MouseEvent<HTMLDivElement>) => void;
  readonly onKeyDownCapture: (event: KeyboardEvent<HTMLDivElement>) => void;
  readonly onMouseDownCapture: (event: MouseEvent<HTMLDivElement>) => void;
}
