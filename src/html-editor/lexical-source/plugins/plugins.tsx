import { useEffect } from 'react';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import { LEXICAL_LOAD_TAG, LEXICAL_SOURCE_ERROR_MESSAGE } from '../constants';
import { exportHtmlSourceFromLexicalEditor, loadHtmlSourceIntoLexicalEditor } from './helpers';
import { getHtmlSecurityWarningText, isInsideProtectedContent } from '../source-html';
import type { HtmlSourcePluginProps } from '../interfaces';

export function HtmlSourcePlugin({
  htmlSource,
  initialHtmlSourceRef,
  isApplyingHtmlSourceRef,
  loadedHtmlSourceRef,
  onDirtyStateChange,
  onHtmlSourceChange,
  onInitializationError,
  onSecurityWarningChange,
}: HtmlSourcePluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (loadedHtmlSourceRef.current === htmlSource) {
      return;
    }

    isApplyingHtmlSourceRef.current = true;
    onSecurityWarningChange?.(getHtmlSecurityWarningText(htmlSource));

    try {
      editor.update(
        () => {
          initialHtmlSourceRef.current = loadHtmlSourceIntoLexicalEditor(editor, htmlSource);
          loadedHtmlSourceRef.current = htmlSource;
          onDirtyStateChange?.(false);
        },
        {
          discrete: true,
          onUpdate: () => {
            isApplyingHtmlSourceRef.current = false;
          },
          tag: LEXICAL_LOAD_TAG,
        }
      );
    } catch {
      isApplyingHtmlSourceRef.current = false;
      onInitializationError?.(LEXICAL_SOURCE_ERROR_MESSAGE);
    }
  }, [
    editor,
    htmlSource,
    initialHtmlSourceRef,
    isApplyingHtmlSourceRef,
    loadedHtmlSourceRef,
    onDirtyStateChange,
    onInitializationError,
    onSecurityWarningChange,
  ]);

  return (
    <OnChangePlugin
      ignoreSelectionChange
      onChange={(editorState, activeEditor, tags) => {
        if (isApplyingHtmlSourceRef.current || tags.has(LEXICAL_LOAD_TAG)) {
          return;
        }

        editorState.read(() => {
          const currentHtmlSource = exportHtmlSourceFromLexicalEditor(activeEditor);

          onSecurityWarningChange?.(getHtmlSecurityWarningText(currentHtmlSource));
          onHtmlSourceChange?.(currentHtmlSource);
          onDirtyStateChange?.(currentHtmlSource !== initialHtmlSourceRef.current);
        });
      }}
    />
  );
}

export function ProtectedContentGuardPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(
    () =>
      editor.registerRootListener((rootElement) => {
        if (!rootElement) {
          return;
        }

        const handleBeforeInput = (event: InputEvent) => {
          if (isInsideProtectedContent(event.target) && !event.inputType.startsWith('delete')) {
            event.preventDefault();
          }
        };

        rootElement.addEventListener('beforeinput', handleBeforeInput);

        return () => {
          rootElement.removeEventListener('beforeinput', handleBeforeInput);
        };
      }),
    [editor]
  );

  return null;
}
