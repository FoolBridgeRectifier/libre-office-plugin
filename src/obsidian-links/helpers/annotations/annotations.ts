import {
  INTERNAL_EMBED_SELECTOR,
  INTERNAL_LINK_SELECTOR,
  OBSIDIAN_BLOCK_ID_SOURCE_ATTRIBUTE,
  OBSIDIAN_LINK_SOURCE_ATTRIBUTE,
  OBSIDIAN_TAG_SOURCE_ATTRIBUTE,
  TAG_SELECTOR,
} from '../../constants';
import type { ObsidianSourceFact } from '../../interfaces';

export function annotateObsidianLinkHtml(
  htmlSource: string,
  sourceFacts: ReadonlyArray<ObsidianSourceFact>
): string {
  const htmlDocument = new DOMParser().parseFromString(htmlSource, 'text/html');

  const linkElements = Array.from(
    htmlDocument.querySelectorAll<HTMLElement>(INTERNAL_LINK_SELECTOR)
  );

  const embedElements = Array.from(
    htmlDocument.querySelectorAll<HTMLElement>(INTERNAL_EMBED_SELECTOR)
  );

  const tagElements = Array.from(htmlDocument.querySelectorAll<HTMLElement>(TAG_SELECTOR));

  const wikiLinkFacts = sourceFacts.filter(isWikiLinkFact);

  const embedFacts = sourceFacts.filter(isEmbedFact);
  const tagFacts = sourceFacts.filter(isTagFact);

  const annotatedWikiLinkCount = annotateElements(
    linkElements,
    wikiLinkFacts,
    OBSIDIAN_LINK_SOURCE_ATTRIBUTE
  );

  const annotatedEmbedCount = annotateElements(
    embedElements,
    embedFacts,
    OBSIDIAN_LINK_SOURCE_ATTRIBUTE
  );

  const annotatedTagCount = annotateElements(tagElements, tagFacts, OBSIDIAN_TAG_SOURCE_ATTRIBUTE);

  appendMissingSourceFacts(
    htmlDocument,
    wikiLinkFacts.slice(annotatedWikiLinkCount),
    OBSIDIAN_LINK_SOURCE_ATTRIBUTE
  );

  appendMissingSourceFacts(
    htmlDocument,
    embedFacts.slice(annotatedEmbedCount),
    OBSIDIAN_LINK_SOURCE_ATTRIBUTE
  );

  appendMissingSourceFacts(
    htmlDocument,
    tagFacts.slice(annotatedTagCount),
    OBSIDIAN_TAG_SOURCE_ATTRIBUTE
  );

  appendMissingBlockIds(htmlDocument, sourceFacts.filter(isBlockIdFact));

  return htmlDocument.body.innerHTML;
}

function annotateElements(
  elements: ReadonlyArray<HTMLElement>,
  sourceFacts: ReadonlyArray<ObsidianSourceFact>,
  attributeName: string
): number {
  let annotatedCount = 0;

  elements.forEach((element, index) => {
    const sourceFact = sourceFacts[index];

    if (sourceFact) {
      element.setAttribute(attributeName, sourceFact.text);
      annotatedCount += 1;
    }
  });

  return annotatedCount;
}

function appendMissingSourceFacts(
  htmlDocument: Document,
  sourceFacts: ReadonlyArray<ObsidianSourceFact>,
  attributeName: string
): void {
  sourceFacts.forEach((sourceFact) => {
    const sourceFactElement = htmlDocument.createElement('span');

    sourceFactElement.setAttribute(attributeName, sourceFact.text);
    sourceFactElement.textContent = sourceFact.text;
    htmlDocument.body.append(sourceFactElement);
  });
}

function appendMissingBlockIds(
  htmlDocument: Document,
  blockIdFacts: ReadonlyArray<ObsidianSourceFact>
): void {
  blockIdFacts.forEach((blockIdFact) => {
    const blockIdElement = htmlDocument.createElement('span');

    blockIdElement.setAttribute(OBSIDIAN_BLOCK_ID_SOURCE_ATTRIBUTE, blockIdFact.text.trim());
    blockIdElement.textContent = blockIdFact.text.trim();
    htmlDocument.body.append(blockIdElement);
  });
}

function isWikiLinkFact(sourceFact: ObsidianSourceFact): boolean {
  return sourceFact.type === 'wikilink';
}

function isEmbedFact(sourceFact: ObsidianSourceFact): boolean {
  return sourceFact.type === 'embed';
}

function isTagFact(sourceFact: ObsidianSourceFact): boolean {
  return sourceFact.type === 'tag';
}

function isBlockIdFact(sourceFact: ObsidianSourceFact): boolean {
  return sourceFact.type === 'block-id';
}
