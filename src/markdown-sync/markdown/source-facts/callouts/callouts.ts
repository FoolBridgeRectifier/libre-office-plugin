import type { MarkdownSourceFactWithOffset } from '../interfaces';

function isCalloutStartLine(line: string): boolean {
  return /^\s*>\s?\[![^\]\n]+\][+-]?/.test(line);
}

function isBlockquoteLine(line: string): boolean {
  return /^\s*>/.test(line);
}

export function collectCalloutFacts(markdownSource: string): MarkdownSourceFactWithOffset[] {
  const facts: MarkdownSourceFactWithOffset[] = [];
  const lines = markdownSource.split('\n');

  let currentOffset = 0;
  let lineIndex = 0;

  while (lineIndex < lines.length) {
    const line = lines[lineIndex] as string;

    if (!isCalloutStartLine(line)) {
      currentOffset += line.length + 1;
      lineIndex += 1;
      continue;
    }

    const openingOffset = currentOffset;
    const calloutLines = [line];

    currentOffset += line.length + 1;
    lineIndex += 1;

    while (lineIndex < lines.length && isBlockquoteLine(lines[lineIndex] as string)) {
      const calloutLine = lines[lineIndex] as string;

      calloutLines.push(calloutLine);
      currentOffset += calloutLine.length + 1;
      lineIndex += 1;
    }

    facts.push({
      sourceOffset: openingOffset,
      text: calloutLines.join('\n'),
      type: 'callout',
    });
  }

  return facts;
}
