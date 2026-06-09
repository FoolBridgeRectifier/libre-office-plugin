import { useEffect, useState } from 'react';

import {
  HTML_EDITOR_BLANK_STATE_CLASS_NAME,
  HTML_EDITOR_EMPTY_STATE_CLASS_NAME,
  HTML_EDITOR_ERROR_CLASS_NAME,
  HTML_EDITOR_WARNING_CLASS_NAME,
} from './constants';
import { LexicalSource } from './lexical-source/LexicalSource';
import type { HtmlEditorProps } from './interfaces';

export function HtmlEditor({
  htmlSource,
  initializationError = null,
  showEmptyState = true,
  onEditorBlur,
  onDirtyStateChange,
  onExternalLinkNavigate,
  onHtmlSourceChange,
  onInternalLinkNavigate,
  onTagNavigate,
}: HtmlEditorProps) {
  const [internalInitializationError, setInternalInitializationError] = useState<string | null>(
    null
  );
  const [securityWarningText, setSecurityWarningText] = useState<string | null>(null);

  const emptyStateClassName = showEmptyState
    ? HTML_EDITOR_EMPTY_STATE_CLASS_NAME
    : HTML_EDITOR_BLANK_STATE_CLASS_NAME;

  useEffect(() => {
    if (htmlSource === null || initializationError) {
      setInternalInitializationError(null);
      setSecurityWarningText(null);
    }

    setInternalInitializationError(null);
  }, [htmlSource, initializationError]);

  const visibleInitializationError = initializationError ?? internalInitializationError;

  if (visibleInitializationError) {
    return (
      <div aria-label="HTML editor error" className={HTML_EDITOR_ERROR_CLASS_NAME} role="alert">
        {visibleInitializationError}
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

      <LexicalSource
        htmlSource={htmlSource}
        onInitializationError={setInternalInitializationError}
        onSecurityWarningChange={setSecurityWarningText}
        {...(onEditorBlur ? { onEditorBlur } : {})}
        {...(onDirtyStateChange ? { onDirtyStateChange } : {})}
        {...(onExternalLinkNavigate ? { onExternalLinkNavigate } : {})}
        {...(onHtmlSourceChange ? { onHtmlSourceChange } : {})}
        {...(onInternalLinkNavigate ? { onInternalLinkNavigate } : {})}
        {...(onTagNavigate ? { onTagNavigate } : {})}
      />
    </>
  );
}
