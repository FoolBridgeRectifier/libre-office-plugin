import { useEffect, useRef } from 'react';

import { isInsideProtectedContent, prepareHtmlForEditor, readHtmlFromEditor } from './helpers';
import type { HtmlEditorProps } from './interfaces';

export function HtmlEditor({
  htmlSource,
  initializationError = null,
  onDirtyStateChange,
  onHtmlSourceChange,
}: HtmlEditorProps) {
  const editorElementRef = useRef<HTMLDivElement | null>(null);
  const initialHtmlSourceRef = useRef('');

  const editorClassName =
    'libre-html-editor markdown-preview-view min-h-64 w-full rounded-ribbon-sm bg-ribbon-bg p-0 font-sans text-text-primary outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-button-focus-ring';

  const stateClassName =
    'min-h-64 rounded-ribbon-sm border border-dashed border-ribbon-border px-4 py-3 font-sans text-sm text-text-secondary';

  const errorClassName =
    'min-h-64 rounded-ribbon-sm border border-icon-red px-4 py-3 font-sans text-sm text-text-primary';

  useEffect(() => {
    if (!editorElementRef.current || htmlSource === null || initializationError) {
      return;
    }

    const preparedHtmlSource = prepareHtmlForEditor(htmlSource);
    const initialHtmlElement = document.createElement('div');

    initialHtmlElement.innerHTML = preparedHtmlSource;
    initialHtmlSourceRef.current = readHtmlFromEditor(initialHtmlElement);
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
      <div aria-label="HTML editor error" className={errorClassName} role="alert">
        {initializationError}
      </div>
    );
  }

  if (htmlSource === null) {
    return (
      <div aria-label="Empty HTML editor" className={stateClassName}>
        No rich HTML source loaded.
      </div>
    );
  }

  const handleEditorInput = () => {
    if (!editorElementRef.current) {
      return;
    }

    const currentHtmlSource = readHtmlFromEditor(editorElementRef.current);
    const isDirty = currentHtmlSource !== initialHtmlSourceRef.current;

    onHtmlSourceChange?.(currentHtmlSource);
    onDirtyStateChange?.(isDirty);
  };

  return (
    <div
      aria-label="Local HTML editor"
      className={editorClassName}
      contentEditable
      onInput={handleEditorInput}
      ref={editorElementRef}
      role="textbox"
      suppressContentEditableWarning
      tabIndex={0}
    />
  );
}
