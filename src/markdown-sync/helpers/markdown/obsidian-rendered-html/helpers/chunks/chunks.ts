export function splitMarkdownIntoRenderedChunks(bodyMarkdown: string): ReadonlyArray<string> {
  const chunks: string[] = [];
  const currentLines: string[] = [];
  let fenceMarker: string | null = null;

  for (const line of bodyMarkdown.split(/\r?\n/)) {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);

    if (fenceMatch && !fenceMarker) {
      fenceMarker = fenceMatch[1][0];
    } else if (fenceMatch && fenceMarker === fenceMatch[1][0]) {
      fenceMarker = null;
    }

    if (!fenceMarker && !line.trim()) {
      appendCurrentChunk(chunks, currentLines);
      continue;
    }

    currentLines.push(line);
  }

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
