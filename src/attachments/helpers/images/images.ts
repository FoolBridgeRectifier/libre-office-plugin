import {
  ATTACHMENT_CAPTION_ATTRIBUTE,
  IMAGE_ATTACHMENT_EXTENSION_PATTERN,
  ATTACHMENT_PATH_ATTRIBUTE,
  ATTACHMENT_SOURCE_ATTRIBUTE,
  ATTACHMENT_STATUS_ATTRIBUTE,
} from '../../constants';
import { parseMarkdownImageSource } from './helpers';
import { parseObsidianWikiLinkSource } from '../../../obsidian-links/helpers';
import type { AttachmentStatus } from '../../interfaces';
import type { MarkdownSourceFact } from '../../../markdown-sync/helpers/markdown/source-facts/interfaces';

function getImageEmbedFacts(sourceFacts: ReadonlyArray<MarkdownSourceFact>): MarkdownSourceFact[] {
  return sourceFacts.filter((sourceFact) => {
    const parsedMarkdownImage = parseMarkdownImageSource(sourceFact.text);
    const parsedSource = parseObsidianWikiLinkSource(sourceFact.text);

    return (
      (sourceFact.type === 'markdown-image' && parsedMarkdownImage !== null) ||
      (sourceFact.type === 'embed' &&
        Boolean(parsedSource?.target.match(IMAGE_ATTACHMENT_EXTENSION_PATTERN)))
    );
  });
}

function getAttachmentTarget(sourceText: string): string | null {
  const parsedMarkdownImage = parseMarkdownImageSource(sourceText);
  const parsedSource = parseObsidianWikiLinkSource(sourceText);

  return parsedMarkdownImage?.target ?? parsedSource?.target ?? null;
}

function getAttachmentCaption(sourceText: string): string | null {
  const parsedMarkdownImage = parseMarkdownImageSource(sourceText);
  const parsedSource = parseObsidianWikiLinkSource(sourceText);

  return parsedMarkdownImage?.altText ?? parsedSource?.alias ?? null;
}

function getAttachmentStatus(element: HTMLElement): AttachmentStatus {
  const imageElement = element.matches('img') ? element : element.querySelector('img');
  const sourceValue = imageElement?.getAttribute('src') ?? '';

  const statusText = [
    element.textContent ?? '',
    imageElement?.getAttribute('alt') ?? '',
    imageElement?.getAttribute('title') ?? '',
  ].join(' ');

  if (/^https?:\/\//i.test(sourceValue)) {
    return 'remote';
  }

  if (/could not be found/i.test(statusText) || element.matches('.is-unresolved,.mod-error')) {
    return 'broken';
  }

  if (imageElement) {
    return 'available';
  }

  return 'broken';
}

function collectImageElements(htmlDocument: Document): HTMLElement[] {
  return Array.from(
    htmlDocument.querySelectorAll<HTMLElement>(
      '.internal-embed, .markdown-embed, span.image-embed, img'
    )
  ).filter((element) => {
    if (element.matches('img') && element.closest('.internal-embed,.markdown-embed')) {
      return false;
    }

    const sourceText = element.getAttribute('data-href') ?? element.getAttribute('alt') ?? '';

    return (
      element.matches('img,.image-embed') ||
      element.querySelector('img') ||
      IMAGE_ATTACHMENT_EXTENSION_PATTERN.test(sourceText)
    );
  });
}

function showBrokenAttachmentState(element: HTMLElement, pathText: string): void {
  if (element.textContent?.trim()) {
    return;
  }

  element.textContent = `Missing attachment: ${pathText}`;
}

export function annotateAttachmentHtml(
  htmlSource: string,
  sourceFacts: ReadonlyArray<MarkdownSourceFact>
): string {
  const htmlDocument = new DOMParser().parseFromString(htmlSource, 'text/html');
  const imageElements = collectImageElements(htmlDocument);
  const imageFacts = getImageEmbedFacts(sourceFacts);

  imageElements.forEach((imageElement, index) => {
    const imageFact = imageFacts[index];
    const pathText = imageFact ? getAttachmentTarget(imageFact.text) : null;
    const captionText = imageFact ? getAttachmentCaption(imageFact.text) : null;
    const status = getAttachmentStatus(imageElement);

    if (imageFact) {
      imageElement.setAttribute(ATTACHMENT_SOURCE_ATTRIBUTE, imageFact.text);
    }

    if (pathText) {
      imageElement.setAttribute(ATTACHMENT_PATH_ATTRIBUTE, pathText);
    }

    if (captionText) {
      imageElement.setAttribute(ATTACHMENT_CAPTION_ATTRIBUTE, captionText);
    }

    imageElement.setAttribute(ATTACHMENT_STATUS_ATTRIBUTE, status);

    if (status === 'broken' && pathText) {
      showBrokenAttachmentState(imageElement, pathText);
    }
  });

  return htmlDocument.body.innerHTML;
}
