import {
  BLOCK_ID_SOURCE_PATTERN,
  COMMENT_SOURCE_PATTERN,
  HARD_BREAK_SOURCE_PATTERN,
  RAW_HTML_SOURCE_PATTERN,
  WIKI_LINK_SOURCE_PATTERN,
} from './constants';
import { readFenceState } from '../obsidian-syntax/utils';
import type { MarkdownSourceFact, MarkdownSourceFacts, MarkdownSourceFactType } from './interfaces';

function collectPatternFacts(
  markdownSource: string,
  pattern: RegExp,
  type: MarkdownSourceFactType
): MarkdownSourceFact[] {
  return Array.from(markdownSource.matchAll(pattern)).map((sourceMatch) => ({
    text: sourceMatch[0],
    type,
  }));
}

function collectWikiLinkFacts(markdownSource: string): MarkdownSourceFact[] {
  return Array.from(markdownSource.matchAll(WIKI_LINK_SOURCE_PATTERN)).map((sourceMatch) => ({
    text: sourceMatch[0],
    type: sourceMatch[1] === '!' ? 'embed' : 'wikilink',
  }));
}

function collectCodeFenceFacts(markdownSource: string): MarkdownSourceFact[] {
  const facts: MarkdownSourceFact[] = [];
  const lines = markdownSource.split('\n');
  let activeFenceCharacter: string | null = null;
  let openingLineIndex: number | null = null;

  for (const [lineIndex, line] of lines.entries()) {
    const fenceState = readFenceState(line);

    if (!fenceState) {
      continue;
    }

    if (openingLineIndex === null) {
      activeFenceCharacter = fenceState.character;
      openingLineIndex = lineIndex;
      continue;
    }

    if (activeFenceCharacter !== fenceState.character) {
      continue;
    }

    facts.push({
      text: lines.slice(openingLineIndex, lineIndex + 1).join('\n'),
      type: 'code-fence',
    });

    activeFenceCharacter = null;
    openingLineIndex = null;
  }

  return facts;
}

export function collectMarkdownSourceFacts(markdownSource: string): MarkdownSourceFacts {
  const facts = [
    ...collectPatternFacts(markdownSource, COMMENT_SOURCE_PATTERN, 'comment'),
    ...collectWikiLinkFacts(markdownSource),
    ...collectCodeFenceFacts(markdownSource),
    ...collectPatternFacts(markdownSource, RAW_HTML_SOURCE_PATTERN, 'raw-html'),
    ...collectPatternFacts(markdownSource, BLOCK_ID_SOURCE_PATTERN, 'block-id'),
    ...collectPatternFacts(markdownSource, HARD_BREAK_SOURCE_PATTERN, 'hard-break'),
  ];

  return { facts };
}
