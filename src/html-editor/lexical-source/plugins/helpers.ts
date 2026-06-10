import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $getRoot, type LexicalEditor } from 'lexical';

import { READ_ONLY_PROTECTED_HTML_SELECTOR } from '../../constants';
import {
  handleCalloutFoldClick,
  handleCalloutFoldKeyDown,
  handleCalloutFoldMouseDown,
} from '../callout/callout';
import {
  handleHeadingCollapseClick,
  handleHeadingCollapseKeyDown,
  handleHeadingCollapseMouseDown,
} from '../heading-collapse/headingCollapse';
import { LOCKED_HTML_PLACEHOLDER_ATTRIBUTE } from '../html-element/constants';
import {
  createNavigationInteractionOptions,
  handleEditorNavigationClick,
  handleEditorNavigationKeyDown,
  handleEditorNavigationMouseDown,
  handlePairedExternalNavigationClick,
} from '../navigation/navigation';
import { prepareHtmlForEditor, readHtmlFromEditor } from '../source-html/sourceHtml';
import {
  handleTaskCheckboxClick,
  handleTaskCheckboxKeyDown,
  handleTaskCheckboxMouseDown,
} from '../task-list/taskList';
import type {
  LexicalSourceInteractionHandlers,
  LexicalSourceInteractionInputs,
} from '../interfaces';

export function createLockedHtmlImportSource(htmlSource: string): string {
  const htmlDocument = new DOMParser().parseFromString(htmlSource, 'text/html');

  htmlDocument
    .querySelectorAll<HTMLElement>(READ_ONLY_PROTECTED_HTML_SELECTOR)
    .forEach((element) => {
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

export function createLexicalSourceInteractionHandlers(
  inputs: LexicalSourceInteractionInputs
): LexicalSourceInteractionHandlers {
  const navigationInteractionOptions = createNavigationInteractionOptions(inputs);

  return {
    onClickCapture: (event) => {
      handleCalloutFoldClick(event, { emitEditorChange: inputs.emitEditorChange });
      handleHeadingCollapseClick(event);
      handleTaskCheckboxClick(event, { emitEditorChange: inputs.emitEditorChange });

      if (consumePairedExternalNavigationClick(event, inputs)) {
        return;
      }

      handleEditorNavigationClick(event, navigationInteractionOptions);
    },
    onKeyDownCapture: (event) => {
      handleCalloutFoldKeyDown(event, { emitEditorChange: inputs.emitEditorChange });
      handleHeadingCollapseKeyDown(event);
      handleTaskCheckboxKeyDown(event, { emitEditorChange: inputs.emitEditorChange });
      handleEditorNavigationKeyDown(event, navigationInteractionOptions);
    },
    onMouseDownCapture: (event) => {
      handleCalloutFoldMouseDown(event);
      handleHeadingCollapseMouseDown(event);
      handleTaskCheckboxMouseDown(event);

      const externalUrl = handleEditorNavigationMouseDown(event, navigationInteractionOptions);

      if (externalUrl) {
        skipPairedClickNavigation(inputs, externalUrl);
      }
    },
  };
}

function consumePairedExternalNavigationClick(
  event: Parameters<LexicalSourceInteractionHandlers['onClickCapture']>[0],
  inputs: LexicalSourceInteractionInputs
): boolean {
  const skippedExternalUrl = inputs.skipNextClickNavigationUrlRef.current;

  if (!handlePairedExternalNavigationClick(event, skippedExternalUrl)) {
    return false;
  }

  inputs.skipNextClickNavigationUrlRef.current = null;

  return true;
}

function skipPairedClickNavigation(
  inputs: LexicalSourceInteractionInputs,
  externalUrl: string
): void {
  inputs.skipNextClickNavigationUrlRef.current = externalUrl;

  setTimeout(() => {
    if (inputs.skipNextClickNavigationUrlRef.current === externalUrl) {
      inputs.skipNextClickNavigationUrlRef.current = null;
    }
  }, 1000);
}
