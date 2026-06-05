export function getCodeBlockMarkdown(element: HTMLElement): string {
  const codeElement = element.querySelector('code');
  const languageClassName = Array.from(codeElement?.classList ?? []).find((className) =>
    className.startsWith('language-')
  );

  const languageName = languageClassName?.replace(/^language-/, '') ?? '';

  return `\`\`\`${languageName}\n${(codeElement ?? element).textContent ?? ''}\n\`\`\``;
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
