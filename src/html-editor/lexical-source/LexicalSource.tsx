import { useEffect, useRef, type FormEvent, type MouseEvent } from 'react';

import { HTML_EDITOR_CLASS_NAME } from '../constants';
import { LEXICAL_SOURCE_ERROR_MESSAGE } from './constants';
import {
  getHtmlSecurityWarningText,
  isInsideProtectedContent,
  prepareHtmlForEditor,
  readHtmlFromEditor,
  syncTaskCheckboxColorHooks,
  updateTaskCheckboxState,
} from './source-html';
import type { LexicalSourceProps } from './interfaces';

export function LexicalSource({
  htmlSource,
  onEditorBlur,
  onDirtyStateChange,
  onHtmlSourceChange,
  onInitializationError,
  onSecurityWarningChange,
}: LexicalSourceProps) {
  const editorElementRef = useRef<HTMLDivElement | null>(null);
  const initialHtmlSourceRef = useRef('');
  const isApplyingHtmlSourceRef = useRef(false);
  const loadedHtmlSourceRef = useRef<string | null>(null);

  const emitEditorChange = (editorElement: HTMLElement) => {
    syncTaskCheckboxColorHooks(editorElement);

    const currentHtmlSource = readHtmlFromEditor(editorElement);

    loadedHtmlSourceRef.current = currentHtmlSource;
    onSecurityWarningChange?.(getHtmlSecurityWarningText(currentHtmlSource));
    onHtmlSourceChange?.(currentHtmlSource);
    onDirtyStateChange?.(currentHtmlSource !== initialHtmlSourceRef.current);
  };

  useEffect(() => {
    if (loadedHtmlSourceRef.current === htmlSource) {
      return;
    }

    const editorElement = editorElementRef.current;

    if (!editorElement) {
      return;
    }

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

  const handleEditorClick = (event: MouseEvent<HTMLDivElement>) => {
    const editorElement = updateTaskCheckboxState(event.target);

    if (editorElement) {
      event.stopPropagation();
      emitEditorChange(editorElement);
    }
  };

  return (
    <div
      aria-label="Local HTML editor"
      className={HTML_EDITOR_CLASS_NAME}
      contentEditable
      onBlur={onEditorBlur}
      onClickCapture={handleEditorClick}
      onInputCapture={handleEditorInput}
      ref={editorElementRef}
      role="textbox"
      suppressContentEditableWarning
      tabIndex={0}
    />
  );
}
