import {
  ATTACHMENT_CAPTION_ATTRIBUTE,
  ATTACHMENT_PATH_ATTRIBUTE,
  ATTACHMENT_SOURCE_ATTRIBUTE,
  ATTACHMENT_STATUS_ATTRIBUTE,
} from '../../constants';
import {
  createObsidianWikiLinkSource,
  parseObsidianWikiLinkSource,
} from '../../../obsidian-links/helpers';
import { isSafeAttachmentPath, isSafeStoredAttachmentTarget } from './helpers/path-safety/helpers';

export function parseMarkdownImageSource(sourceText: string): {
  readonly altText: string | null;
  readonly target: string;
} | null {
  const markdownImageMatch = /^!\[([^\]\n]*)\]\(([^)\n]+)\)$/.exec(sourceText.trim());

  if (!markdownImageMatch) {
    return null;
  }

  const altText = markdownImageMatch[1] ?? '';

  return {
    altText: altText || null,
    target: markdownImageMatch[2] ?? '',
  };
}

function getCurrentAttachmentPath(element: HTMLElement): string | null {
  return (
    element.getAttribute('data-href') ??
    element.getAttribute(ATTACHMENT_PATH_ATTRIBUTE) ??
    element.querySelector('img')?.getAttribute('data-href') ??
    null
  );
}

function getCurrentCaption(element: HTMLElement): string | null {
  const figureCaption = element.querySelector('figcaption')?.textContent?.trim();
  const imageAlt = element.matches('img')
    ? element.getAttribute('alt')
    : element.querySelector('img')?.getAttribute('alt');

  return figureCaption || imageAlt || element.getAttribute(ATTACHMENT_CAPTION_ATTRIBUTE);
}

function getRemoteImageMarkdown(element: HTMLElement): string | null {
  const imageElement = element.matches('img') ? element : element.querySelector('img');
  const sourceValue = imageElement?.getAttribute('src') ?? '';

  if (!/^https?:\/\//i.test(sourceValue)) {
    return null;
  }

  return `![${getCurrentCaption(element) ?? ''}](${sourceValue})`;
}

function isSafeStoredAttachmentSource(
  parsedSource: ReturnType<typeof parseObsidianWikiLinkSource>,
  parsedMarkdownImage: ReturnType<typeof parseMarkdownImageSource>
): boolean {
  if (parsedMarkdownImage) {
    return isSafeStoredAttachmentTarget(parsedMarkdownImage.target, true);
  }

  return parsedSource !== null && isSafeAttachmentPath(parsedSource.target);
}

function isAttachmentElement(element: HTMLElement): boolean {
  return (
    element.hasAttribute(ATTACHMENT_SOURCE_ATTRIBUTE) ||
    element.hasAttribute(ATTACHMENT_PATH_ATTRIBUTE) ||
    element.matches('img,.image-embed') ||
    Boolean(element.querySelector('img'))
  );
}

export function getAttachmentMarkdown(element: HTMLElement): string | null {
  if (!isAttachmentElement(element)) {
    return null;
  }

  const remoteImageMarkdown = getRemoteImageMarkdown(element);

  if (remoteImageMarkdown !== null) {
    return remoteImageMarkdown;
  }

  const sourceText = element.getAttribute(ATTACHMENT_SOURCE_ATTRIBUTE);
  const parsedSource = sourceText ? parseObsidianWikiLinkSource(sourceText) : null;
  const parsedMarkdownImage = sourceText ? parseMarkdownImageSource(sourceText) : null;

  if (
    sourceText &&
    element.getAttribute(ATTACHMENT_STATUS_ATTRIBUTE) === 'broken' &&
    isSafeStoredAttachmentSource(parsedSource, parsedMarkdownImage)
  ) {
    return sourceText;
  }

  if (
    sourceText &&
    parsedMarkdownImage &&
    !getCurrentAttachmentPath(element) &&
    isSafeStoredAttachmentSource(parsedSource, parsedMarkdownImage)
  ) {
    return sourceText;
  }

  const currentPath =
    getCurrentAttachmentPath(element) ??
    parsedSource?.target ??
    parsedMarkdownImage?.target ??
    null;

  if (!currentPath || !isSafeAttachmentPath(currentPath)) {
    return null;
  }

  const currentCaption = getCurrentCaption(element);

  if (
    sourceText &&
    parsedMarkdownImage &&
    currentPath === parsedMarkdownImage.target &&
    currentCaption === parsedMarkdownImage.altText
  ) {
    return sourceText;
  }

  if (
    parsedSource &&
    currentPath === parsedSource.target &&
    currentCaption === parsedSource.alias
  ) {
    return sourceText;
  }

  return createObsidianWikiLinkSource({
    alias: currentCaption,
    embedded: true,
    target: currentPath,
  });
}
