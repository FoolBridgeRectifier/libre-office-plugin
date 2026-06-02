import {
  protectCalloutLine,
  protectInlineObsidianSyntax,
  readFenceState,
  replaceOutsideCodeSpans,
  restoreProtectedObsidianSyntax,
} from './utils';
import type {
  MarkdownFenceState,
  ObsidianMarkdownProtectionResult,
  ObsidianMarkdownToken,
} from './interfaces';

export { restoreProtectedObsidianSyntax };

export function protectObsidianMarkdownSyntax(markdown: string): ObsidianMarkdownProtectionResult {
  const tokens: ObsidianMarkdownToken[] = [];
  let activeFenceState: MarkdownFenceState | null = null;

  const protectedLines = markdown.split('\n').map((line) => {
    const fenceState = readFenceState(line);

    if (fenceState && activeFenceState === null) {
      activeFenceState = fenceState;

      return line;
    }

    if (fenceState && activeFenceState?.character === fenceState.character) {
      activeFenceState = null;

      return line;
    }

    if (activeFenceState !== null) {
      return line;
    }

    const lineWithProtectedCallout = protectCalloutLine(line, tokens);

    return replaceOutsideCodeSpans(lineWithProtectedCallout, (text) =>
      protectInlineObsidianSyntax(text, tokens)
    );
  });

  return { markdown: protectedLines.join('\n'), tokens };
}
