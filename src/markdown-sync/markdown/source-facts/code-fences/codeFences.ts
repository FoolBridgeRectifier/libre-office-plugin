import { FENCE_SOURCE_PATTERN } from '../constants';
import type { MarkdownSourceFactWithOffset } from '../interfaces';

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

export function collectCodeFenceFacts(markdownSource: string): MarkdownSourceFactWithOffset[] {
  const facts: MarkdownSourceFactWithOffset[] = [];
  const lines = markdownSource.split('\n');

  let activeFenceCharacter: '`' | '~' | null = null;
  let openingLineIndex: number | null = null;

  let currentOffset = 0;
  let openingOffset = 0;

  for (const [lineIndex, line] of lines.entries()) {
    const fenceCharacter = readFenceCharacter(line);

    if (!fenceCharacter) {
      currentOffset += line.length + 1;
      continue;
    }

    if (openingLineIndex === null) {
      activeFenceCharacter = fenceCharacter;
      openingLineIndex = lineIndex;
      openingOffset = currentOffset;

      currentOffset += line.length + 1;
      continue;
    }

    if (activeFenceCharacter !== fenceCharacter) {
      currentOffset += line.length + 1;
      continue;
    }

    facts.push({
      sourceOffset: openingOffset,
      text: lines.slice(openingLineIndex, lineIndex + 1).join('\n'),
      type: 'code-fence',
    });

    activeFenceCharacter = null;
    openingLineIndex = null;

    currentOffset += line.length + 1;
  }

  return facts;
}
