import { MARKDOWN_IMAGE_SOURCE_PATTERN } from '../../../source-facts/constants';

export function maskRemoteMarkdownImageSources(markdownSource: string): string {
  let placeholderIndex = 0;

  return markdownSource.replace(MARKDOWN_IMAGE_SOURCE_PATTERN, (imageSource) => {
    const target = imageSource.match(/\]\(([^)\n]+)\)$/)?.[1] ?? '';

    if (!isRemoteImageTarget(target)) {
      return imageSource;
    }

    const altText = imageSource.match(/^!\[([^\]\n]*)\]/)?.[1] ?? '';
    const placeholderPath = `libre-note-editor-remote-image-${placeholderIndex++}.png`;

    return `![${altText}](${placeholderPath})`;
  });
}

function isRemoteImageTarget(target: string): boolean {
  return /^https?:\/\//i.test(target.trim());
}
