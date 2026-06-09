import { FOLDABLE_CALLOUT_MARKERS } from './constants';

function isFoldableMarker(marker: string): boolean {
  return FOLDABLE_CALLOUT_MARKERS.some((foldableMarker) => foldableMarker === marker);
}

function getDefaultCalloutTitle(calloutType: string): string {
  return calloutType
    .split(/[-_\s]+/)
    .filter((part) => part.length > 0)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(' ');
}

export function getCalloutFoldMarker(element: HTMLElement): string {
  const foldMarker = element.getAttribute('data-callout-fold') ?? '';

  return isFoldableMarker(foldMarker) ? foldMarker : '';
}

export function getImplicitTitleComparisonSource(
  preservedSource: string,
  currentTitle: string
): string {
  const sourceLines = preservedSource.split('\n');
  const openingLineMatch = /^(\s*>\s?\[!([^\]\n]+)\][+-]?)(?:[ \t](.*))?$/.exec(
    sourceLines[0] ?? ''
  );

  if (!openingLineMatch || openingLineMatch[3]) {
    return preservedSource;
  }

  const defaultTitle = getDefaultCalloutTitle(openingLineMatch[2] ?? '');

  return currentTitle === defaultTitle
    ? [`${openingLineMatch[1]} ${currentTitle}`, ...sourceLines.slice(1)].join('\n')
    : preservedSource;
}

export function getPreservedSourceWithCurrentFoldMarker(
  preservedSource: string,
  element: HTMLElement
): string | null {
  let hasOpeningLine = false;
  const normalizedSource = preservedSource.replace(/\r\n/g, '\n');
  const sourceLines = normalizedSource.split('\n');
  const currentFoldMarker = getCalloutFoldMarker(element);

  const updatedOpeningLine = (sourceLines[0] ?? '').replace(
    /^(\s*>\s?\[![^\]\n]+\])([+-]?)/,
    (_match, openingPrefix: string) => {
      hasOpeningLine = true;

      return `${openingPrefix}${currentFoldMarker}`;
    }
  );

  return hasOpeningLine ? [updatedOpeningLine, ...sourceLines.slice(1)].join('\n') : null;
}

export function normalizeMarkdownSource(markdownSource: string): string {
  return markdownSource.replace(/\r\n/g, '\n').trimEnd();
}
