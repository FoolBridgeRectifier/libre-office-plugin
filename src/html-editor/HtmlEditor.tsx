import { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';

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
  const [securityWarningText, setSecurityWarningText] = useState<string | null>(null);

  const editorClassName = classNames(
    'libre-html-editor markdown-preview-view min-h-64 w-full min-w-0 max-w-full box-border',
    'overflow-x-hidden rounded-ribbon-sm bg-ribbon-bg p-0 font-sans text-text-primary',
    'outline-none [overflow-wrap:anywhere] focus-visible:outline focus-visible:outline-2',
    'focus-visible:outline-button-focus-ring',
    '[&_.libre-contained-editor-media]:h-auto [&_.libre-contained-editor-media]:max-w-full',
    '[&_.libre-contained-editor-media]:object-contain',
    '[&_.libre-protected-html-block]:max-w-full',
    '[&_.libre-protected-html-block]:overflow-x-auto',
    '[&_.libre-table-scroll]:max-w-full [&_.libre-table-scroll]:overflow-x-auto',
    '[&_pre]:max-w-full [&_pre]:overflow-x-auto'
  );

  const stateClassName =
    'min-h-64 min-w-0 max-w-full rounded-ribbon-sm border border-dashed border-ribbon-border px-4 py-3 font-sans text-sm text-text-secondary';

  const blankStateClassName = 'min-h-64 w-full min-w-0 max-w-full';

  const errorClassName =
    'min-h-64 min-w-0 max-w-full rounded-ribbon-sm border border-icon-red px-4 py-3 font-sans text-sm text-text-primary';

  const warningClassName =
    'rounded-ribbon-sm border border-icon-orange px-3 py-2 font-sans text-[12px] text-text-primary';

  useEffect(() => {
    if (htmlSource === null || initializationError) {
      setSecurityWarningText(null);
      return;
    }

    if (!editorElementRef.current) {
      return;
    }

    setSecurityWarningText(getHtmlSecurityWarningText(htmlSource));
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
      <div
        aria-label={showEmptyState ? 'Empty HTML editor' : 'Blank HTML editor'}
        className={showEmptyState ? stateClassName : blankStateClassName}
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
        <div aria-label="HTML security warning" className={warningClassName} role="alert">
          {securityWarningText}
        </div>
      ) : null}

      <div
        aria-label="Local HTML editor"
        className={editorClassName}
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
