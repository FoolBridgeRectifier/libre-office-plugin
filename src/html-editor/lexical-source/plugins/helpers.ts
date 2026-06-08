import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $getRoot, type LexicalEditor } from 'lexical';

import { LOCKED_HTML_PLACEHOLDER_ATTRIBUTE } from '../html-element/constants';
import { prepareHtmlForEditor, readHtmlFromEditor } from '../source-html/sourceHtml';

export function createLockedHtmlImportSource(htmlSource: string): string {
  const htmlDocument = new DOMParser().parseFromString(htmlSource, 'text/html');

  htmlDocument.querySelectorAll<HTMLElement>('[data-libre-protected]').forEach((element) => {
    const placeholderElement = htmlDocument.createElement('div');

    placeholderElement.setAttribute(LOCKED_HTML_PLACEHOLDER_ATTRIBUTE, element.outerHTML);
    element.replaceWith(placeholderElement);
  });

  return htmlDocument.body.innerHTML;
}

export function loadHtmlSourceIntoLexicalEditor(editor: LexicalEditor, htmlSource: string): string {
  const preparedHtmlSource = prepareHtmlForEditor(htmlSource);
  const importHtmlSource = createLockedHtmlImportSource(preparedHtmlSource);
  const htmlDocument = new DOMParser().parseFromString(importHtmlSource, 'text/html');

  const generatedNodes = $generateNodesFromDOM(editor, htmlDocument);
  const root = $getRoot();

  root.clear();
  root.append(...generatedNodes);

  return exportHtmlSourceFromLexicalEditor(editor);
}

export function exportHtmlSourceFromLexicalEditor(editor: LexicalEditor): string {
  const htmlSource = $generateHtmlFromNodes(editor);
  const wrapperElement = document.createElement('div');

  wrapperElement.innerHTML = htmlSource;

  return readHtmlFromEditor(wrapperElement);
}
