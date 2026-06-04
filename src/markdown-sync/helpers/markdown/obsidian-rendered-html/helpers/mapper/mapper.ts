import { cleanRenderedMarkdownElement } from '../cleanup/cleanup';

function repairEscapedHeadingEmphasis(cleanedElement: HTMLElement): void {
  for (const headingElement of cleanedElement.querySelectorAll<HTMLElement>('h1,h2,h3,h4,h5,h6')) {
    const headingSource = headingElement.getAttribute('data-heading') ?? '';

    if (!headingSource.includes('\\*')) {
      continue;
    }

    for (const spanElement of headingElement.querySelectorAll<HTMLSpanElement>('span[style]')) {
      const spanText = spanElement.textContent;

      if (spanText === null || !spanText.startsWith('*') || spanElement.children.length > 0) {
        continue;
      }

      const emphasisElement = document.createElement('em');

      emphasisElement.textContent = spanText.slice(1);
      spanElement.replaceChildren(emphasisElement);
    }
  }
}

export function mapRenderedMarkdownElementToHtml(containerElement: HTMLElement): string {
  const cleanedElement = cleanRenderedMarkdownElement(containerElement);

  repairEscapedHeadingEmphasis(cleanedElement);

  // Obsidian theme CSS depends on the rendered DOM shape, classes, dir, and data attributes.
  return cleanedElement.innerHTML;
}
