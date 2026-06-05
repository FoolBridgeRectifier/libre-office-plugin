export interface HtmlEditorProps {
  readonly htmlSource: string | null;
  readonly initializationError?: string | null;
  readonly onDirtyStateChange?: (isDirty: boolean) => void;
  readonly onHtmlSourceChange?: (htmlSource: string) => void;
}
