import { CALLOUT_CONTENT_SELECTOR, CALLOUT_TITLE_SELECTOR } from './constants';
import {
  getCalloutFoldMarker,
  getImplicitTitleComparisonSource,
  getPreservedSourceWithCurrentFoldMarker,
  normalizeMarkdownSource,
} from './helpers';
import type { ReadBlockMarkdown, ReadInlineMarkdown } from './interfaces';

function getCalloutTitleMarkdown(
  element: HTMLElement,
  readInlineMarkdown: ReadInlineMarkdown
): string {
  const titleElement = element.querySelector<HTMLElement>(CALLOUT_TITLE_SELECTOR);

  return titleElement
    ? Array.from(titleElement.childNodes).map(readInlineMarkdown).join('').trim()
    : '';
}

function getCalloutBodyMarkdown(
  element: HTMLElement,
  readBlockMarkdown: ReadBlockMarkdown
): string {
  const contentElement = element.querySelector<HTMLElement>(CALLOUT_CONTENT_SELECTOR);

  if (!contentElement) {
    return '';
  }

  return Array.from(contentElement.children)
    .filter((childElement): childElement is HTMLElement => childElement instanceof HTMLElement)
    .map(readBlockMarkdown)
    .filter((markdownBlock) => markdownBlock.length > 0)
    .join('\n\n');
}

function prefixCalloutBodyLine(markdownLine: string): string {
  return markdownLine.length > 0 ? `> ${markdownLine}` : '>';
}

function getGeneratedCalloutMarkdown(
  element: HTMLElement,
  readBlockMarkdown: ReadBlockMarkdown,
  readInlineMarkdown: ReadInlineMarkdown
): string {
  const calloutType = element.getAttribute('data-callout')?.trim() || 'note';
  const titleMarkdown = getCalloutTitleMarkdown(element, readInlineMarkdown);
  const titleSuffix = titleMarkdown.length > 0 ? ` ${titleMarkdown}` : '';
  const openingLine = `> [!${calloutType}]${getCalloutFoldMarker(element)}${titleSuffix}`;

  const bodyMarkdown = getCalloutBodyMarkdown(element, readBlockMarkdown);

  if (bodyMarkdown.length === 0) {
    return openingLine;
  }

  return [
    openingLine,
    ...bodyMarkdown.split('\n').map((markdownLine) => prefixCalloutBodyLine(markdownLine)),
  ].join('\n');
}

export function getCalloutMarkdown(
  element: HTMLElement,
  preservedSource: string | null,
  readBlockMarkdown: ReadBlockMarkdown,
  readInlineMarkdown: ReadInlineMarkdown
): string {
  const generatedMarkdown = getGeneratedCalloutMarkdown(
    element,
    readBlockMarkdown,
    readInlineMarkdown
  );

  const preservedCandidate = preservedSource
    ? getPreservedSourceWithCurrentFoldMarker(preservedSource, element)
    : null;

  const comparisonCandidate = preservedCandidate
    ? getImplicitTitleComparisonSource(
        preservedCandidate,
        getCalloutTitleMarkdown(element, readInlineMarkdown)
      )
    : null;

  return preservedCandidate && comparisonCandidate
    ? normalizeMarkdownSource(comparisonCandidate) === normalizeMarkdownSource(generatedMarkdown)
      ? preservedCandidate
      : generatedMarkdown
    : generatedMarkdown;
}
