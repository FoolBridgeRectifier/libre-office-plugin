import {
  BLOCK_ID_SOURCE_PATTERN,
  COMMENT_SOURCE_PATTERN,
  HARD_BREAK_SOURCE_PATTERN,
  MARKDOWN_IMAGE_SOURCE_PATTERN,
  RAW_HTML_SOURCE_PATTERN,
  TAG_SOURCE_PATTERN,
  WIKI_LINK_SOURCE_PATTERN,
} from './constants';
import { collectCalloutFacts } from './callouts/callouts';
import { collectCodeFenceFacts } from './code-fences/codeFences';
import { collectInlineCodeFacts } from './inline-code/inlineCode';
import type {
  MarkdownSourceFacts,
  MarkdownSourceFactType,
  MarkdownSourceFactWithOffset,
  SourceRange,
} from './interfaces';

function collectPatternFacts(
  markdownSource: string,
  pattern: RegExp,
  type: MarkdownSourceFactType
): MarkdownSourceFactWithOffset[] {
  return Array.from(markdownSource.matchAll(pattern)).map((sourceMatch) => ({
    sourceOffset: sourceMatch.index,
    text: sourceMatch[0],
    type,
  }));
}

function collectWikiLinkFacts(markdownSource: string): MarkdownSourceFactWithOffset[] {
  return Array.from(markdownSource.matchAll(WIKI_LINK_SOURCE_PATTERN)).map((sourceMatch) => ({
    sourceOffset: sourceMatch.index,
    text: sourceMatch[0],
    type: sourceMatch[1] === '!' ? 'embed' : 'wikilink',
  }));
}

function collectTagFacts(markdownSource: string, excludedRanges: SourceRange[]) {
  return Array.from(markdownSource.matchAll(TAG_SOURCE_PATTERN))
    .filter((sourceMatch) => !isOffsetInsideRanges(sourceMatch.index, excludedRanges))
    .flatMap((sourceMatch) => {
      const typedSourceMatch = sourceMatch as RegExpMatchArray & {
        1: string;
        2: string;
        index: number;
      };

      const prefixText = typedSourceMatch[1];
      const tagText = typedSourceMatch[2];

      return [
        {
          sourceOffset: typedSourceMatch.index + prefixText.length,
          text: `#${tagText}`,
          type: 'tag' as const,
        },
      ];
    });
}

function isOffsetInsideRanges(
  sourceOffset: number | undefined,
  ranges: ReadonlyArray<SourceRange>
) {
  return ranges.some(
    (sourceRange) =>
      sourceOffset !== undefined &&
      sourceOffset >= sourceRange.startOffset &&
      sourceOffset < sourceRange.endOffset
  );
}

export function collectMarkdownSourceFacts(markdownSource: string): MarkdownSourceFacts {
  const codeFenceFacts = collectCodeFenceFacts(markdownSource);
  const codeFenceRanges = getSourceFactRanges(codeFenceFacts);
  const calloutFacts = collectCalloutFacts(markdownSource);

  const facts = [
    ...collectPatternFacts(markdownSource, COMMENT_SOURCE_PATTERN, 'comment'),
    ...collectPatternFacts(markdownSource, MARKDOWN_IMAGE_SOURCE_PATTERN, 'markdown-image'),
    ...collectWikiLinkFacts(markdownSource),
    ...calloutFacts,
    ...codeFenceFacts,
    ...collectInlineCodeFacts(markdownSource, codeFenceRanges),
    ...collectPatternFacts(markdownSource, RAW_HTML_SOURCE_PATTERN, 'raw-html'),
    ...collectPatternFacts(markdownSource, BLOCK_ID_SOURCE_PATTERN, 'block-id'),
    ...collectPatternFacts(markdownSource, HARD_BREAK_SOURCE_PATTERN, 'hard-break'),
    ...collectTagFacts(markdownSource, codeFenceRanges),
  ].sort((leftFact, rightFact) => leftFact.sourceOffset - rightFact.sourceOffset);

  return {
    facts: facts.map(({ sourceOffset: _sourceOffset, ...sourceFact }) => sourceFact),
  };
}

function getSourceFactRanges(
  sourceFacts: ReadonlyArray<MarkdownSourceFactWithOffset>
): SourceRange[] {
  return sourceFacts.map((sourceFact) => ({
    endOffset: sourceFact.sourceOffset + sourceFact.text.length,
    startOffset: sourceFact.sourceOffset,
  }));
}
