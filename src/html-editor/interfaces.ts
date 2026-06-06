export interface HtmlEditorProps {
  readonly htmlSource: string | null;
  readonly initializationError?: string | null;
  readonly showEmptyState?: boolean;
  readonly onEditorBlur?: () => void;
  readonly onDirtyStateChange?: (isDirty: boolean) => void;
  readonly onHtmlSourceChange?: (htmlSource: string) => void;
}
