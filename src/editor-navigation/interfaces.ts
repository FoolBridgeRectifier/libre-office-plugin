export interface EditorNavigationHandlers {
  readonly onExternalLinkNavigate?: (url: string) => void;
  readonly onInternalLinkNavigate?: (target: string) => void;
  readonly onTagNavigate?: (tagText: string) => void;
}
