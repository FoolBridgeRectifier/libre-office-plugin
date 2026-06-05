import type { MarkdownSourceFactWithOffset, SourceRange } from '../../interfaces';

function readBacktickRunLength(markdownSource: string, sourceOffset: number): number {
  let runLength = 0;

  while (markdownSource[sourceOffset + runLength] === '`') {
    runLength += 1;
  }

  return runLength;
}

function isOffsetInsideRanges(sourceOffset: number, ranges: ReadonlyArray<SourceRange>): boolean {
  return ranges.some(
    (sourceRange) => sourceOffset >= sourceRange.startOffset && sourceOffset < sourceRange.endOffset
  );
}

export function collectInlineCodeFacts(
  markdownSource: string,
  excludedRanges: ReadonlyArray<SourceRange>
): MarkdownSourceFactWithOffset[] {
  const facts: MarkdownSourceFactWithOffset[] = [];

  let sourceOffset = 0;

  while (sourceOffset < markdownSource.length) {
    if (
      markdownSource[sourceOffset] !== '`' ||
      isOffsetInsideRanges(sourceOffset, excludedRanges)
    ) {
      sourceOffset += 1;
      continue;
    }

    const openingRunLength = readBacktickRunLength(markdownSource, sourceOffset);
    const closingMarker = '`'.repeat(openingRunLength);
    const closingOffset = markdownSource.indexOf(closingMarker, sourceOffset + openingRunLength);

    if (closingOffset === -1) {
      sourceOffset += openingRunLength;
      continue;
    }

    const endOffset = closingOffset + openingRunLength;

    facts.push({
      sourceOffset,
      text: markdownSource.slice(sourceOffset, endOffset),
      type: 'inline-code',
    });

    sourceOffset = endOffset;
  }

  return facts;
}
