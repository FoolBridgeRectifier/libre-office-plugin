import { getObsidianBlockMarkdown, getObsidianInlineMarkdown } from '../../obsidian-links';
import { getAttachmentMarkdown, getTableMarkdown } from '../../attachments';
import { getStructuredMarkdownSource } from '../../markdown-sync/markdown/structured-blocks/structuredBlocks';
import { getCodeBlockMarkdown, getListMarkdown } from './utils';

function getInlineMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? '';
  }

  if (!(node instanceof HTMLElement)) {
    return '';
  }

  const attachmentMarkdown = getAttachmentMarkdown(node);
  const obsidianMarkdown = getObsidianInlineMarkdown(node);
  const structuredMarkdownSource = getStructuredMarkdownSource(node);

  if (attachmentMarkdown !== null) {
    return attachmentMarkdown;
  }

  if (obsidianMarkdown !== null) {
    return obsidianMarkdown;
  }

  if (structuredMarkdownSource !== null) {
    return structuredMarkdownSource;
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

function getBlockMarkdown(element: HTMLElement): string {
  const attachmentMarkdown = getAttachmentMarkdown(element);
  const tableMarkdown = getTableMarkdown(element, getInlineMarkdown);
  const obsidianMarkdown = getObsidianBlockMarkdown(element);
  const structuredMarkdownSource = getStructuredMarkdownSource(element);

  if (attachmentMarkdown !== null) {
    return attachmentMarkdown;
  }

  if (tableMarkdown !== null) {
    return tableMarkdown;
  }

  if (obsidianMarkdown !== null) {
    return obsidianMarkdown;
  }

  if (structuredMarkdownSource !== null) {
    return structuredMarkdownSource;
  }

  const tagName = element.tagName.toLowerCase();
  const inlineMarkdown = getInlineMarkdown(element).trim();

  if (/^h[1-6]$/.test(tagName)) {
    return inlineMarkdown.length === 0
      ? ''
      : `${'#'.repeat(Number(tagName.slice(1)))} ${inlineMarkdown}`;
  }

  if (tagName === 'p') {
    return inlineMarkdown;
  }

  if (tagName === 'pre') {
    return element.dataset.libreProtected === 'raw-markdown'
      ? (element.textContent ?? '')
      : getCodeBlockMarkdown(element);
  }

  if (tagName === 'ul' || tagName === 'ol') {
    return getListMarkdown(element, tagName === 'ol', getInlineMarkdown);
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
