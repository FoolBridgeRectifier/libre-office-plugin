import type { MutableRefObject } from 'react';

export interface LexicalSourceProps {
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
