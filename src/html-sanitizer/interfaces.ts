export interface HtmlSanitizationResult {
  readonly htmlSource: string;
  readonly removedUnsafeContent: boolean;
}
