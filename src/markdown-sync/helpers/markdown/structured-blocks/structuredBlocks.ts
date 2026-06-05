import {
  STRUCTURED_MARKDOWN_SOURCE_ATTRIBUTE,
  STRUCTURED_MARKDOWN_TYPE_ATTRIBUTE,
} from './constants';
import { PROTECTED_MARKER_ATTRIBUTE } from '../../../constants';
import type { MarkdownSourceFact } from '../source-facts/interfaces';

function annotateElements(
  elements: ReadonlyArray<HTMLElement>,
  sourceFacts: ReadonlyArray<MarkdownSourceFact>,
  structuredType: string,
  isProtected: boolean
): void {
  elements.forEach((element, index) => {
    const sourceFact = sourceFacts[index];

    if (!sourceFact) {
      return;
    }

    element.setAttribute(STRUCTURED_MARKDOWN_SOURCE_ATTRIBUTE, sourceFact.text);
    element.setAttribute(STRUCTURED_MARKDOWN_TYPE_ATTRIBUTE, structuredType);

    if (isProtected) {
      element.setAttribute(PROTECTED_MARKER_ATTRIBUTE, structuredType);
    }
  });
}

function collectInlineCodeElements(htmlDocument: Document): HTMLElement[] {
  return Array.from(htmlDocument.querySelectorAll<HTMLElement>('code')).filter(
    (codeElement) => codeElement.closest('pre') === null
  );
}

function collectTopLevelCalloutElements(htmlDocument: Document): HTMLElement[] {
  return Array.from(htmlDocument.querySelectorAll<HTMLElement>('.callout[data-callout]')).filter(
    (calloutElement) => calloutElement.parentElement?.closest('.callout') === null
  );
}

function appendProtectedRawMarkdownFacts(
  htmlDocument: Document,
  sourceFacts: ReadonlyArray<MarkdownSourceFact>
): void {
  for (const sourceFact of sourceFacts) {
    const rawBlockElement = htmlDocument.createElement('pre');

    rawBlockElement.setAttribute(PROTECTED_MARKER_ATTRIBUTE, 'raw-markdown');
    rawBlockElement.setAttribute(STRUCTURED_MARKDOWN_SOURCE_ATTRIBUTE, sourceFact.text);
    rawBlockElement.setAttribute(STRUCTURED_MARKDOWN_TYPE_ATTRIBUTE, sourceFact.type);
    rawBlockElement.textContent = sourceFact.text;

    htmlDocument.body.append(rawBlockElement);
  }
}

export function annotateStructuredMarkdownHtml(
  htmlSource: string,
  sourceFacts: ReadonlyArray<MarkdownSourceFact>
): string {
  const htmlDocument = new DOMParser().parseFromString(htmlSource, 'text/html');
  const codeFenceFacts = sourceFacts.filter((sourceFact) => sourceFact.type === 'code-fence');
  const calloutFacts = sourceFacts.filter((sourceFact) => sourceFact.type === 'callout');
  const inlineCodeFacts = sourceFacts.filter((sourceFact) => sourceFact.type === 'inline-code');

  const unsupportedRawFacts = sourceFacts.filter((sourceFact) => sourceFact.type === 'comment');

  annotateElements(
    Array.from(htmlDocument.querySelectorAll<HTMLElement>('pre')),
    codeFenceFacts,
    'code-fence',
    true
  );

  annotateElements(collectTopLevelCalloutElements(htmlDocument), calloutFacts, 'callout', false);

  annotateElements(collectInlineCodeElements(htmlDocument), inlineCodeFacts, 'inline-code', false);
  appendProtectedRawMarkdownFacts(htmlDocument, unsupportedRawFacts);

  return htmlDocument.body.innerHTML;
}

export function getStructuredMarkdownSource(element: HTMLElement): string | null {
  return element.getAttribute(STRUCTURED_MARKDOWN_SOURCE_ATTRIBUTE);
}
