import { useCallback, useMemo, useRef } from 'react';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalComposer } from '@lexical/react/LexicalComposer';

import { HTML_EDITOR_CLASS_NAME } from '../constants';
import { LEXICAL_EDITOR_NAMESPACE, LEXICAL_SOURCE_ERROR_MESSAGE } from './constants';
import { HtmlElementNode, LockedHtmlNode } from './html-element/htmlElement';
import { HtmlSourcePlugin, InteractionPlugin, ProtectedContentGuardPlugin } from './plugins';
import {
  getHtmlSecurityWarningText,
  readHtmlFromEditor,
  syncRichTextEditorHooks,
} from './source-html';
import type { LexicalSourceProps } from './interfaces';

export function LexicalSource({
  htmlSource,
  onEditorBlur,
  onDirtyStateChange,
  onExternalLinkNavigate,
  onHtmlSourceChange,
  onInternalLinkNavigate,
  onInitializationError,
  onSecurityWarningChange,
  onTagNavigate,
}: LexicalSourceProps) {
  const editorElementRef = useRef<HTMLDivElement | null>(null);
  const initialHtmlSourceRef = useRef('');
  const isApplyingHtmlSourceRef = useRef(false);
  const loadedHtmlSourceRef = useRef<string | null>(null);

  const skipNextClickNavigationUrlRef = useRef<string | null>(null);

  const editorConfig = useMemo(
    () => ({
      namespace: LEXICAL_EDITOR_NAMESPACE,
      nodes: [HtmlElementNode, LockedHtmlNode],
      onError: () => onInitializationError?.(LEXICAL_SOURCE_ERROR_MESSAGE),
    }),
    [onInitializationError]
  );

  const emitEditorChange = useCallback(
    (editorElement: HTMLElement) => {
      syncRichTextEditorHooks(editorElement);

      const currentHtmlSource = readHtmlFromEditor(editorElement);

      loadedHtmlSourceRef.current = currentHtmlSource;
      onSecurityWarningChange?.(getHtmlSecurityWarningText(currentHtmlSource));
      onHtmlSourceChange?.(currentHtmlSource);
      onDirtyStateChange?.(currentHtmlSource !== initialHtmlSourceRef.current);
    },
    [onDirtyStateChange, onHtmlSourceChange, onSecurityWarningChange]
  );

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <ContentEditable
        aria-label="Local HTML editor"
        className={HTML_EDITOR_CLASS_NAME}
        onBlur={onEditorBlur}
        ref={editorElementRef}
        role="textbox"
        tabIndex={0}
      />
      <HtmlSourcePlugin
        emitEditorChange={emitEditorChange}
        htmlSource={htmlSource}
        initialHtmlSourceRef={initialHtmlSourceRef}
        isApplyingHtmlSourceRef={isApplyingHtmlSourceRef}
        loadedHtmlSourceRef={loadedHtmlSourceRef}
        {...(onDirtyStateChange ? { onDirtyStateChange } : {})}
        {...(onInitializationError ? { onInitializationError } : {})}
        {...(onSecurityWarningChange ? { onSecurityWarningChange } : {})}
      />
      <ProtectedContentGuardPlugin isApplyingHtmlSourceRef={isApplyingHtmlSourceRef} />
      <InteractionPlugin
        emitEditorChange={emitEditorChange}
        skipNextClickNavigationUrlRef={skipNextClickNavigationUrlRef}
        {...(onExternalLinkNavigate ? { onExternalLinkNavigate } : {})}
        {...(onInternalLinkNavigate ? { onInternalLinkNavigate } : {})}
        {...(onTagNavigate ? { onTagNavigate } : {})}
      />
    </LexicalComposer>
  );
}
