import { useEffect, useRef, type FormEvent } from 'react';

import { HTML_EDITOR_CLASS_NAME } from '../constants';
import { LEXICAL_SOURCE_ERROR_MESSAGE } from './constants';
import {
  getHtmlSecurityWarningText,
  isInsideProtectedContent,
  prepareHtmlForEditor,
  readHtmlFromEditor,
  syncTaskCheckboxColorHooks,
} from './source-html';
import { createLexicalSourceInteractionHandlers } from './helpers';
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

  const emitEditorChange = (editorElement: HTMLElement) => {
    syncTaskCheckboxColorHooks(editorElement);

    const currentHtmlSource = readHtmlFromEditor(editorElement);

    loadedHtmlSourceRef.current = currentHtmlSource;
    onSecurityWarningChange?.(getHtmlSecurityWarningText(currentHtmlSource));
    onHtmlSourceChange?.(currentHtmlSource);
    onDirtyStateChange?.(currentHtmlSource !== initialHtmlSourceRef.current);
  };

  useEffect(() => {
    if (loadedHtmlSourceRef.current === htmlSource) return;

    const editorElement = editorElementRef.current;

    if (!editorElement) return;

    isApplyingHtmlSourceRef.current = true;
    onSecurityWarningChange?.(getHtmlSecurityWarningText(htmlSource));

    try {
      editorElement.innerHTML = prepareHtmlForEditor(htmlSource);
      syncTaskCheckboxColorHooks(editorElement);

      initialHtmlSourceRef.current = readHtmlFromEditor(editorElement);
      loadedHtmlSourceRef.current = htmlSource;
      onDirtyStateChange?.(false);
    } catch {
      onInitializationError?.(LEXICAL_SOURCE_ERROR_MESSAGE);
    } finally {
      isApplyingHtmlSourceRef.current = false;
    }
  }, [htmlSource, onDirtyStateChange, onInitializationError, onSecurityWarningChange]);

  useEffect(() => {
    const editorElement = editorElementRef.current;

    if (!editorElement) {
      return;
    }

    const handleBeforeInput = (event: InputEvent) => {
      // Protected source blocks are visible but only removable from the editor.
      if (isInsideProtectedContent(event.target) && !event.inputType.startsWith('delete')) {
        event.preventDefault();
      }
    };

    editorElement.addEventListener('beforeinput', handleBeforeInput);

    return () => {
      editorElement.removeEventListener('beforeinput', handleBeforeInput);
    };
  }, []);

  const handleEditorInput = (event: FormEvent<HTMLDivElement>) => {
    if (isApplyingHtmlSourceRef.current) {
      return;
    }

    emitEditorChange(event.currentTarget);
  };

  const interactionHandlers = createLexicalSourceInteractionHandlers({
    emitEditorChange,
    ...(onExternalLinkNavigate ? { onExternalLinkNavigate } : {}),
    ...(onInternalLinkNavigate ? { onInternalLinkNavigate } : {}),
    ...(onTagNavigate ? { onTagNavigate } : {}),
    skipNextClickNavigationUrlRef,
  });

  return (
    <div
      aria-label="Local HTML editor"
      className={HTML_EDITOR_CLASS_NAME}
      contentEditable
      onBlur={onEditorBlur}
      onClickCapture={interactionHandlers.onClickCapture}
      onInputCapture={handleEditorInput}
      onKeyDownCapture={interactionHandlers.onKeyDownCapture}
      onMouseDownCapture={interactionHandlers.onMouseDownCapture}
      ref={editorElementRef}
      role="textbox"
      suppressContentEditableWarning
      tabIndex={0}
    />
  );
}
