import { cleanRenderedMarkdownElement } from '../cleanup/cleanup';

function repairEscapedHeadingEmphasis(cleanedElement: HTMLElement): void {
  cleanedElement.querySelectorAll<HTMLElement>('h1,h2,h3,h4,h5,h6').forEach((headingElement) => {
    const headingSource = headingElement.getAttribute('data-heading') ?? '';

    if (!headingSource.includes('\\*')) {
      return;
    }

    headingElement.querySelectorAll<HTMLSpanElement>('span[style]').forEach((spanElement) => {
      const spanText = spanElement.textContent;

      if (spanText === null || !spanText.startsWith('*') || spanElement.children.length > 0) {
        return;
      }

      const emphasisElement = document.createElement('em');

      emphasisElement.textContent = spanText.slice(1);
      spanElement.replaceChildren(emphasisElement);
    });
  });
}

export function mapRenderedMarkdownElementToHtml(containerElement: HTMLElement): string {
  const cleanedElement = cleanRenderedMarkdownElement(containerElement);

  repairEscapedHeadingEmphasis(cleanedElement);

  // Obsidian theme CSS depends on the rendered DOM shape, classes, dir, and data attributes.
  return cleanedElement.innerHTML;
}
