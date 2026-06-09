import type { EditorViewNavigationTarget } from './interfaces';

export function navigateEditorViewExternalLink(
  target: EditorViewNavigationTarget,
  url: string
): void {
  target.editorViewOptions.openExternalLink?.(url);
}

export function navigateEditorViewInternalLink(
  target: EditorViewNavigationTarget,
  linkTarget: string
): void {
  if (!target.activeMarkdownFile) {
    return;
  }

  target.editorViewOptions.navigateInternalLink?.(linkTarget, target.activeMarkdownFile.path);
}

export function navigateEditorViewTag(target: EditorViewNavigationTarget, tagText: string): void {
  target.editorViewOptions.navigateTag?.(tagText);
}
