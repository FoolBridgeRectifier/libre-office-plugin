import {
  BLOCK_ID_SOURCE_PATTERN,
  COMMENT_SOURCE_PATTERN,
  FENCE_SOURCE_PATTERN,
  HARD_BREAK_SOURCE_PATTERN,
  RAW_HTML_SOURCE_PATTERN,
  WIKI_LINK_SOURCE_PATTERN,
} from './constants';
import type { MarkdownSourceFact, MarkdownSourceFacts, MarkdownSourceFactType } from './interfaces';

function readFenceCharacter(line: string): '`' | '~' | null {
  const fenceMatch = FENCE_SOURCE_PATTERN.exec(line);

  if (!fenceMatch) {
    return null;
  }

  const typedFenceMatch = fenceMatch as RegExpMatchArray & { 1: string; 2: string };
  const fenceCharacter = typedFenceMatch[1].charAt(0);
  const fenceInfo = typedFenceMatch[2];

  if (fenceCharacter === '`' && fenceInfo.includes('`')) {
    return null;
  }

  return fenceCharacter === '`' ? '`' : '~';
}

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
  let activeFenceCharacter: '`' | '~' | null = null;
  let openingLineIndex: number | null = null;

  for (const [lineIndex, line] of lines.entries()) {
    const fenceCharacter = readFenceCharacter(line);

    if (!fenceCharacter) {
      continue;
    }

    if (openingLineIndex === null) {
      activeFenceCharacter = fenceCharacter;
      openingLineIndex = lineIndex;
      continue;
    }

    if (activeFenceCharacter !== fenceCharacter) {
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
