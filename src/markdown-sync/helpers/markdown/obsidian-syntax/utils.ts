import { FENCE_PATTERN } from './constants';
import type { MarkdownFenceState } from './interfaces';

export function readFenceState(line: string): MarkdownFenceState | null {
  const fenceMatch = FENCE_PATTERN.exec(line);

  if (!fenceMatch) {
    return null;
  }

  if (fenceMatch[1][0] === '`' && fenceMatch[2].includes('`')) {
    return null;
  }

  return {
    character: fenceMatch[1][0] as '`' | '~',
    length: fenceMatch[1].length,
  };
}
