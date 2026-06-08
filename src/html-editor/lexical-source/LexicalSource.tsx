import { useMemo, useRef, type FormEvent } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';

import { HTML_EDITOR_CLASS_NAME } from '../constants';
import { LEXICAL_EDITOR_NAMESPACE, LEXICAL_SOURCE_ERROR_MESSAGE } from './constants';
import { HtmlElementNode, LockedHtmlNode } from './html-element/htmlElement';
import { HtmlSourcePlugin, LockedContentGuardPlugin } from './plugins/plugins';
import { getHtmlSecurityWarningText, readHtmlFromEditor } from './source-html/sourceHtml';
import type { LexicalSourceProps } from './interfaces';

export function LexicalSource({
  htmlSource,
  onEditorBlur,
  onDirtyStateChange,
  onHtmlSourceChange,
  onInitializationError,
  onSecurityWarningChange,
}: LexicalSourceProps) {
  const initialHtmlSourceRef = useRef('');
  const isApplyingHtmlSourceRef = useRef(false);
  const loadedHtmlSourceRef = useRef<string | null>(null);

  const initialConfig = useMemo(
    () => ({
      namespace: LEXICAL_EDITOR_NAMESPACE,
      nodes: [HtmlElementNode, LockedHtmlNode],
      onError: () => onInitializationError?.(LEXICAL_SOURCE_ERROR_MESSAGE),
    }),
    [onInitializationError]
  );

  const handleEditorInput = (event: FormEvent<HTMLDivElement>) => {
    if (isApplyingHtmlSourceRef.current) {
      return;
    }

    const currentHtmlSource = readHtmlFromEditor(event.currentTarget);

    onSecurityWarningChange?.(getHtmlSecurityWarningText(currentHtmlSource));
    onHtmlSourceChange?.(currentHtmlSource);
    onDirtyStateChange?.(currentHtmlSource !== initialHtmlSourceRef.current);
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={
          <ContentEditable
            ariaLabel="Local HTML editor"
            className={HTML_EDITOR_CLASS_NAME}
            onBlur={onEditorBlur}
            onInputCapture={handleEditorInput}
            role="textbox"
            tabIndex={0}
          />
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
      <HtmlSourcePlugin
        htmlSource={htmlSource}
        initialHtmlSourceRef={initialHtmlSourceRef}
        isApplyingHtmlSourceRef={isApplyingHtmlSourceRef}
        loadedHtmlSourceRef={loadedHtmlSourceRef}
        {...(onDirtyStateChange ? { onDirtyStateChange } : {})}
        {...(onHtmlSourceChange ? { onHtmlSourceChange } : {})}
        {...(onInitializationError ? { onInitializationError } : {})}
        {...(onSecurityWarningChange ? { onSecurityWarningChange } : {})}
      />
      <LockedContentGuardPlugin />
    </LexicalComposer>
  );
}
