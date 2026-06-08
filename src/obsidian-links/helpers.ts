import {
  OBSIDIAN_BLOCK_ID_SOURCE_ATTRIBUTE,
  OBSIDIAN_LINK_SOURCE_ATTRIBUTE,
  OBSIDIAN_TAG_SOURCE_ATTRIBUTE,
  TAG_SELECTOR,
} from './constants';
import type { ObsidianWikiLinkParts } from './interfaces';

function getAttributeValue(element: HTMLElement, attributeName: string): string | null {
  const attributeValue = element.getAttribute(attributeName);

  return attributeValue?.trim() || null;
}

export function parseObsidianWikiLinkSource(sourceText: string): ObsidianWikiLinkParts | null {
  const wikiLinkMatch = /^(!?)\[\[([^\]\n]+)\]\]$/.exec(sourceText.trim());

  if (!wikiLinkMatch) {
    return null;
  }

  const embedPrefix = wikiLinkMatch[1] ?? '';
  const bodyText = wikiLinkMatch[2] ?? '';
  const pipeIndex = bodyText.lastIndexOf('|');

  return {
    alias: pipeIndex === -1 ? null : bodyText.slice(pipeIndex + 1),
    embedded: embedPrefix === '!',
    target: pipeIndex === -1 ? bodyText : bodyText.slice(0, pipeIndex),
  };
}

export function createObsidianWikiLinkSource(parts: ObsidianWikiLinkParts): string {
  const aliasSuffix = parts.alias === null ? '' : `|${parts.alias}`;
  const embedPrefix = parts.embedded ? '!' : '';

  return `${embedPrefix}[[${parts.target}${aliasSuffix}]]`;
}

function getNoteLabel(target: string): string {
  return target.split('/').at(-1)?.replace(/\.md$/i, '') ?? target;
}

function getDefaultLinkLabel(target: string): string {
  const blockParts = target.split('#^');

  if (blockParts.length === 2) {
    const blockIdLabel = blockParts[1] ?? '';

    return blockParts[0] ? `${getNoteLabel(blockParts[0])} > ^${blockIdLabel}` : `^${blockIdLabel}`;
  }

  const headingParts = target.split('#');

  if (headingParts.length === 2) {
    const headingLabel = headingParts[1] ?? '';

    return headingParts[0] ? `${getNoteLabel(headingParts[0])} > ${headingLabel}` : headingLabel;
  }

  return getNoteLabel(target);
}

function getCompactTargetLabel(target: string): string {
  if (target.includes('#^')) {
    return target.split('#^').at(-1) ?? target;
  }

  if (target.includes('#')) {
    return target.split('#').at(-1) ?? target;
  }

  return getNoteLabel(target);
}

function createWikiLinkFromRenderedAnchor(element: HTMLElement): string | null {
  const target = getAttributeValue(element, 'data-href') ?? getAttributeValue(element, 'href');

  if (!target || target.startsWith('#')) {
    return null;
  }

  const label = element.textContent?.trim() ?? '';
  const defaultLabel = getDefaultLinkLabel(target);
  const alias = label && label !== defaultLabel ? label : null;

  return createObsidianWikiLinkSource({ alias, embedded: false, target });
}

function createWikiLinkFromStoredSource(element: HTMLElement): string | null {
  const sourceText = getAttributeValue(element, OBSIDIAN_LINK_SOURCE_ATTRIBUTE);
  const parsedSource = sourceText ? parseObsidianWikiLinkSource(sourceText) : null;

  if (!sourceText || !parsedSource) {
    return null;
  }

  const currentLabel = element.textContent?.trim() ?? '';
  const expectedLabel = parsedSource.alias ?? getDefaultLinkLabel(parsedSource.target);

  if (currentLabel === sourceText) {
    return sourceText;
  }

  if (
    !currentLabel ||
    currentLabel === expectedLabel ||
    currentLabel === getCompactTargetLabel(parsedSource.target)
  ) {
    return sourceText;
  }

  return createObsidianWikiLinkSource({ ...parsedSource, alias: currentLabel });
}

export function getObsidianInlineMarkdown(element: HTMLElement): string | null {
  if (element.matches(TAG_SELECTOR)) {
    return element.textContent?.trim() ?? getAttributeValue(element, OBSIDIAN_TAG_SOURCE_ATTRIBUTE);
  }

  if (getAttributeValue(element, OBSIDIAN_TAG_SOURCE_ATTRIBUTE)) {
    return getAttributeValue(element, OBSIDIAN_TAG_SOURCE_ATTRIBUTE);
  }

  return createWikiLinkFromStoredSource(element) ?? createWikiLinkFromRenderedAnchor(element);
}

export function getObsidianBlockMarkdown(element: HTMLElement): string | null {
  const blockIdSource = getAttributeValue(element, OBSIDIAN_BLOCK_ID_SOURCE_ATTRIBUTE);

  if (blockIdSource) {
    return blockIdSource;
  }

  const linkSource = getAttributeValue(element, OBSIDIAN_LINK_SOURCE_ATTRIBUTE);

  if (linkSource) {
    return createWikiLinkFromStoredSource(element) ?? linkSource;
  }

  return getAttributeValue(element, OBSIDIAN_TAG_SOURCE_ATTRIBUTE);
}

export { annotateObsidianLinkHtml } from './annotations/annotations';
