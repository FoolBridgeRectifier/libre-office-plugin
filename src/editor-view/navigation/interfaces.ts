import type { EditorViewSourceTarget } from '../interfaces';

export type EditorViewNavigationTarget = Pick<
  EditorViewSourceTarget,
  'activeMarkdownFile' | 'editorViewOptions'
>;
