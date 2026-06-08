export function getCodeBlockMarkdown(element: HTMLElement): string {
  const codeElement = element.querySelector('code');
  const languageClassName = Array.from(codeElement?.classList ?? []).find((className) =>
    className.startsWith('language-')
  );

  const languageName = languageClassName?.replace(/^language-/, '') ?? '';

  return `\`\`\`${languageName}\n${(codeElement ?? element).textContent ?? ''}\n\`\`\``;
}

function getCodeFenceParts(
  markdownSource: string
): { readonly code: string; readonly language: string } | null {
  const sourceLines = markdownSource.replace(/\r\n/g, '\n').split('\n');
  const openingFence = /^(`{3,}|~{3,})([^\n]*)$/.exec(sourceLines[0] ?? '');
  const closingFence = sourceLines[sourceLines.length - 1] ?? '';

  if (!openingFence || closingFence.trim() !== openingFence[1]) {
    return null;
  }

  const infoText = openingFence[2]?.trim() ?? '';

  return {
    code: sourceLines.slice(1, -1).join('\n'),
    language: infoText.split(/\s+/)[0] ?? '',
  };
}

export function getCodeFenceMarkdown(element: HTMLElement, preservedSource: string | null): string {
  const currentMarkdown = getCodeBlockMarkdown(element);
  const preservedCodeFence = preservedSource ? getCodeFenceParts(preservedSource) : null;
  const currentCodeFence = getCodeFenceParts(currentMarkdown);

  if (
    preservedCodeFence &&
    currentCodeFence &&
    preservedCodeFence.code === currentCodeFence.code &&
    preservedCodeFence.language === currentCodeFence.language
  ) {
    return preservedSource as string;
  }

  return currentMarkdown;
}

export function getListMarkdown(
  element: HTMLElement,
  isOrdered: boolean,
  readInlineMarkdown: (node: Node) => string
): string {
  return Array.from(element.children)
    .filter((childElement): childElement is HTMLElement => childElement instanceof HTMLElement)
    .map((childElement, index) => {
      const marker = isOrdered ? `${index + 1}.` : '-';
      const checkboxPrefix = childElement.matches('[data-task="x"]') ? '[x] ' : '';

      return `${marker} ${checkboxPrefix}${readInlineMarkdown(childElement).trim()}`;
    })
    .join('\n');
}
