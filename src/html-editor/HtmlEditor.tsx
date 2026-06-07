import { useEffect, useRef, useState } from 'react';

import {
  HTML_EDITOR_BLANK_STATE_CLASS_NAME,
  HTML_EDITOR_CLASS_NAME,
  HTML_EDITOR_EMPTY_STATE_CLASS_NAME,
  HTML_EDITOR_ERROR_CLASS_NAME,
  HTML_EDITOR_WARNING_CLASS_NAME,
} from './constants';
import {
  getHtmlSecurityWarningText,
  isInsideProtectedContent,
  prepareHtmlForEditor,
  readHtmlFromEditor,
} from './helpers';
import type { HtmlEditorProps } from './interfaces';

export function HtmlEditor({
  htmlSource,
  initializationError = null,
  showEmptyState = true,
  onEditorBlur,
  onDirtyStateChange,
  onHtmlSourceChange,
}: HtmlEditorProps) {
  const editorElementRef = useRef<HTMLDivElement | null>(null);
  const initialHtmlSourceRef = useRef('');
  const loadedHtmlSourceRef = useRef<string | null>(null);

  const [securityWarningText, setSecurityWarningText] = useState<string | null>(null);

  const emptyStateClassName = showEmptyState
    ? HTML_EDITOR_EMPTY_STATE_CLASS_NAME
    : HTML_EDITOR_BLANK_STATE_CLASS_NAME;

  useEffect(() => {
    if (htmlSource === null || initializationError) {
      loadedHtmlSourceRef.current = null;
      setSecurityWarningText(null);
      return;
    }

    if (!editorElementRef.current) {
      return;
    }

    setSecurityWarningText(getHtmlSecurityWarningText(htmlSource));

    if (
      loadedHtmlSourceRef.current !== null &&
      readHtmlFromEditor(editorElementRef.current) === htmlSource
    ) {
      return;
    }

    const preparedHtmlSource = prepareHtmlForEditor(htmlSource);
    const initialHtmlElement = document.createElement('div');

    initialHtmlElement.innerHTML = preparedHtmlSource;
    initialHtmlSourceRef.current = readHtmlFromEditor(initialHtmlElement);
    loadedHtmlSourceRef.current = initialHtmlSourceRef.current;
    editorElementRef.current.innerHTML = preparedHtmlSource;

    onDirtyStateChange?.(false);
  }, [htmlSource, initializationError, onDirtyStateChange]);

  useEffect(() => {
    const editorElement = editorElementRef.current;

    if (!editorElement) {
      return;
    }

    const handleBeforeInput = (event: InputEvent) => {
      if (isInsideProtectedContent(event.target)) {
        event.preventDefault();
      }
    };

    editorElement.addEventListener('beforeinput', handleBeforeInput);

    return () => {
      editorElement.removeEventListener('beforeinput', handleBeforeInput);
    };
  }, []);

  if (initializationError) {
    return (
      <div aria-label="HTML editor error" className={HTML_EDITOR_ERROR_CLASS_NAME} role="alert">
        {initializationError}
      </div>
    );
  }

  if (htmlSource === null) {
    return (
      <div
        aria-label={showEmptyState ? 'Empty HTML editor' : 'Blank HTML editor'}
        className={emptyStateClassName}
      />
    );
  }

  const handleEditorInput = () => {
    if (!editorElementRef.current) {
      return;
    }

    const rawHtmlSource = editorElementRef.current.innerHTML;
    const currentHtmlSource = readHtmlFromEditor(editorElementRef.current);
    const isDirty = currentHtmlSource !== initialHtmlSourceRef.current;
    const unsafeContentWarningText = getHtmlSecurityWarningText(rawHtmlSource);

    if (unsafeContentWarningText) {
      editorElementRef.current.innerHTML = prepareHtmlForEditor(currentHtmlSource);
    }

    setSecurityWarningText(unsafeContentWarningText);
    onHtmlSourceChange?.(currentHtmlSource);
    onDirtyStateChange?.(isDirty);
  };

  return (
    <>
      {securityWarningText ? (
        <div
          aria-label="HTML security warning"
          className={HTML_EDITOR_WARNING_CLASS_NAME}
          role="alert"
        >
          {securityWarningText}
        </div>
      ) : null}

      <div
        aria-label="Local HTML editor"
        className={HTML_EDITOR_CLASS_NAME}
        contentEditable
        onBlur={onEditorBlur}
        onInput={handleEditorInput}
        ref={editorElementRef}
        role="textbox"
        suppressContentEditableWarning
        tabIndex={0}
      />
    </>
  );
}
