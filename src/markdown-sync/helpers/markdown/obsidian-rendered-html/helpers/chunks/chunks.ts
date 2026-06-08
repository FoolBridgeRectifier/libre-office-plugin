export function splitMarkdownIntoRenderedChunks(bodyMarkdown: string): ReadonlyArray<string> {
  const chunks: string[] = [];
  const currentLines: string[] = [];
  let fenceMarker: string | null = null;

  bodyMarkdown.split(/\r?\n/).forEach((line) => {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    const matchedFenceMarker = fenceMatch?.[1] ?? null;
    const matchedFenceCharacter = matchedFenceMarker?.[0] ?? null;

    if (matchedFenceCharacter && !fenceMarker) {
      fenceMarker = matchedFenceCharacter;
    } else if (matchedFenceCharacter && fenceMarker === matchedFenceCharacter) {
      fenceMarker = null;
    }

    if (!fenceMarker && !line.trim()) {
      appendCurrentChunk(chunks, currentLines);
      return;
    }

    currentLines.push(line);
  });

  appendCurrentChunk(chunks, currentLines);

  return chunks;
}

function appendCurrentChunk(chunks: string[], currentLines: string[]): void {
  const chunk = currentLines.join('\n').trim();

  if (chunk) {
    chunks.push(chunk);
  }

  currentLines.length = 0;
}
