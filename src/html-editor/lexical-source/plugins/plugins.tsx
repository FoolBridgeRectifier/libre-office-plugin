import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import { LEXICAL_LOAD_TAG, LEXICAL_SOURCE_ERROR_MESSAGE } from '../constants';
import { getHtmlSecurityWarningText, syncRichTextEditorHooks } from '../source-html';
import { createLexicalSourceInteractionHandlers, loadHtmlSourceIntoLexicalEditor } from './helpers';
import type { HtmlSourcePluginProps, LexicalSourceInteractionInputs } from '../interfaces';

export function HtmlSourcePlugin({
  emitEditorChange,
  htmlSource,
  initialHtmlSourceRef,
  isApplyingHtmlSourceRef,
  loadedHtmlSourceRef,
  onDirtyStateChange,
  onInitializationError,
  onSecurityWarningChange,
}: HtmlSourcePluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(
    () =>
      editor.registerUpdateListener(() => {
        const editorElement = editor.getRootElement();

        if (editorElement) {
          syncRichTextEditorHooks(editorElement);
          setTimeout(() => syncRichTextEditorHooks(editorElement), 0);
        }
      }),
    [editor]
  );

  useEffect(() => {
    let syncTimeout: ReturnType<typeof setTimeout> | null = null;
    let mutationObserver: MutationObserver | null = null;

    const clearSync = () => {
      if (syncTimeout) clearTimeout(syncTimeout);
      mutationObserver?.disconnect();
    };

    const unregisterRootListener = editor.registerRootListener((editorElement) => {
      clearSync();

      if (!editorElement) return;

      const scheduleSync = () => {
        if (syncTimeout) clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => syncRichTextEditorHooks(editorElement), 0);
      };

      mutationObserver = new MutationObserver(scheduleSync);
      mutationObserver.observe(editorElement, { childList: true, subtree: true });
      scheduleSync();
    });

    return () => {
      clearSync();
      unregisterRootListener();
    };
  }, [editor]);

  useEffect(() => {
    if (loadedHtmlSourceRef.current === htmlSource) return;

    isApplyingHtmlSourceRef.current = true;
    onSecurityWarningChange?.(getHtmlSecurityWarningText(htmlSource));

    try {
      let loadedHtmlSource = '';

      editor.update(
        () => {
          loadedHtmlSource = loadHtmlSourceIntoLexicalEditor(editor, htmlSource);
        },
        { discrete: true, tag: LEXICAL_LOAD_TAG }
      );

      initialHtmlSourceRef.current = loadedHtmlSource;
      loadedHtmlSourceRef.current = htmlSource;
      onDirtyStateChange?.(false);
    } catch {
      onInitializationError?.(LEXICAL_SOURCE_ERROR_MESSAGE);
    } finally {
      isApplyingHtmlSourceRef.current = false;
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

  useEffect(() => {
    const editorElement = editor.getRootElement();

    if (!editorElement) return;

    const handleInput = () => {
      if (!isApplyingHtmlSourceRef.current) {
        emitEditorChange(editorElement);
      }
    };

    editorElement.addEventListener('input', handleInput, true);

    return () => {
      editorElement.removeEventListener('input', handleInput, true);
    };
  }, [editor, emitEditorChange, isApplyingHtmlSourceRef]);

  return null;
}

export function InteractionPlugin(inputs: LexicalSourceInteractionInputs) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const editorElement = editor.getRootElement();

    if (!editorElement) return;

    const interactionHandlers = createLexicalSourceInteractionHandlers(inputs);

    const handleClick = (event: MouseEvent) => interactionHandlers.onClickCapture(event as never);

    const handleKeyDown = (event: KeyboardEvent) =>
      interactionHandlers.onKeyDownCapture(event as never);

    const handleMouseDown = (event: MouseEvent) =>
      interactionHandlers.onMouseDownCapture(event as never);

    editorElement.addEventListener('click', handleClick, true);
    editorElement.addEventListener('keydown', handleKeyDown, true);
    editorElement.addEventListener('mousedown', handleMouseDown, true);

    return () => {
      editorElement.removeEventListener('click', handleClick, true);
      editorElement.removeEventListener('keydown', handleKeyDown, true);
      editorElement.removeEventListener('mousedown', handleMouseDown, true);
    };
  }, [editor, inputs]);

  return null;
}
