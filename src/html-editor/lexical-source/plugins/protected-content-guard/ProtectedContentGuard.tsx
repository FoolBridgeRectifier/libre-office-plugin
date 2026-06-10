import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import { isInsideProtectedContent } from '../../source-html';
import type { ProtectedContentGuardPluginProps } from '../../interfaces';

export function ProtectedContentGuardPlugin({
  isApplyingHtmlSourceRef,
}: ProtectedContentGuardPluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const editorElement = editor.getRootElement();

    if (!editorElement) return;

    const handleBeforeInput = (event: InputEvent) => {
      // Protected source blocks are visible but only removable from the editor.
      if (
        !isApplyingHtmlSourceRef.current &&
        isInsideProtectedContent(event.target) &&
        !event.inputType.startsWith('delete')
      ) {
        event.preventDefault();
      }
    };

    editorElement.addEventListener('beforeinput', handleBeforeInput);

    return () => {
      editorElement.removeEventListener('beforeinput', handleBeforeInput);
    };
  }, [editor, isApplyingHtmlSourceRef]);

  return null;
}
