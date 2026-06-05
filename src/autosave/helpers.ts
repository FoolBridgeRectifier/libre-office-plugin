import {
  DEFAULT_HTML_AUTOSAVE_INTERVAL_MS,
  DEFAULT_MARKDOWN_SYNC_INTERVAL_MS,
  DEFAULT_RETRY_DELAY_MS,
  FRONTMATTER_BLOCK_TEMPLATE,
} from './constants';
import { splitFrontmatter } from '../markdown-sync/helpers';
import type { AutosaveControllerOptions, AutosaveTimerHandle } from './interfaces';

export function clearAutosaveTimer(timerHandle: AutosaveTimerHandle | null): void {
  if (timerHandle !== null) {
    clearTimeout(timerHandle);
  }
}

export function getAutosaveTiming(options: AutosaveControllerOptions) {
  return {
    htmlAutosaveIntervalMs: options.htmlAutosaveIntervalMs ?? DEFAULT_HTML_AUTOSAVE_INTERVAL_MS,
    markdownSyncIntervalMs: options.markdownSyncIntervalMs ?? DEFAULT_MARKDOWN_SYNC_INTERVAL_MS,
    retryDelayMs: options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS,
  };
}

function getInlineMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? '';
  }

  if (!(node instanceof HTMLElement)) {
    return '';
  }

  const childMarkdown = Array.from(node.childNodes).map(getInlineMarkdown).join('');

  if (node.matches('strong,b')) {
    return `**${childMarkdown}**`;
  }

  if (node.matches('em,i')) {
    return `*${childMarkdown}*`;
  }

  if (node.matches('code')) {
    return `\`${childMarkdown}\``;
  }

  if (node.matches('a')) {
    return `[${childMarkdown}](${node.getAttribute('href') ?? ''})`;
  }

  if (node.matches('br')) {
    return '\n';
  }

  return childMarkdown;
}

function getCodeBlockMarkdown(element: HTMLElement): string {
  const codeElement = element.querySelector('code');
  const languageClassName = Array.from(codeElement?.classList ?? []).find((className) =>
    className.startsWith('language-')
  );

  const languageName = languageClassName?.replace(/^language-/, '') ?? '';

  return `\`\`\`${languageName}\n${(codeElement ?? element).textContent ?? ''}\n\`\`\``;
}

function getListMarkdown(element: HTMLElement, isOrdered: boolean): string {
  return Array.from(element.children)
    .filter((childElement): childElement is HTMLElement => childElement instanceof HTMLElement)
    .map((childElement, index) => {
      const marker = isOrdered ? `${index + 1}.` : '-';
      const checkboxPrefix = childElement.matches('[data-task="x"]') ? '[x] ' : '';

      return `${marker} ${checkboxPrefix}${getInlineMarkdown(childElement).trim()}`;
    })
    .join('\n');
}

function getBlockMarkdown(element: HTMLElement): string {
  const tagName = element.tagName.toLowerCase();

  if (/^h[1-6]$/.test(tagName)) {
    return `${'#'.repeat(Number(tagName.slice(1)))} ${getInlineMarkdown(element).trim()}`;
  }

  if (tagName === 'p') {
    return getInlineMarkdown(element).trim();
  }

  if (tagName === 'pre') {
    return element.dataset.libreProtected === 'raw-markdown'
      ? (element.textContent ?? '')
      : getCodeBlockMarkdown(element);
  }

  if (tagName === 'ul' || tagName === 'ol') {
    return getListMarkdown(element, tagName === 'ol');
  }

  if (tagName === 'blockquote') {
    return getElementMarkdown(element)
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n');
  }

  if (tagName === 'hr') {
    return '---';
  }

  return getElementMarkdown(element);
}

function getElementMarkdown(element: HTMLElement): string {
  return Array.from(element.children)
    .filter((childElement): childElement is HTMLElement => childElement instanceof HTMLElement)
    .filter((childElement) => childElement.tagName.toLowerCase() !== 'template')
    .map(getBlockMarkdown)
    .filter((markdownBlock) => markdownBlock.length > 0)
    .join('\n\n');
}

export function convertHtmlToMarkdownMirror(htmlSource: string): string {
  const htmlDocument = new DOMParser().parseFromString(htmlSource, 'text/html');
  const rootElement = htmlDocument.querySelector('article') ?? htmlDocument.body;

  return getElementMarkdown(rootElement).trimEnd();
}

export function createMarkdownMirrorSource(
  currentMarkdownSource: string,
  htmlSource: string
): string {
  const { frontmatter } = splitFrontmatter(currentMarkdownSource);
  const bodyMarkdown = convertHtmlToMarkdownMirror(htmlSource);

  if (frontmatter === null) {
    return bodyMarkdown;
  }

  return FRONTMATTER_BLOCK_TEMPLATE.replace('{frontmatter}', frontmatter).replace(
    '{bodyMarkdown}',
    bodyMarkdown
  );
}
