import { OBSIDIAN_LINK_SOURCE_ATTRIBUTE } from '../constants';
import { parseObsidianWikiLinkSource } from '../helpers';
import { createObsidianLinkWarnings } from './helpers';
import { PROTECTED_MARKER_ATTRIBUTE } from '../../markdown-sync/constants';
import type { MarkdownSourceFacts } from '../../markdown-sync/markdown/source-facts/interfaces';
import type { ObsidianLinkTargetResolver, ObsidianLinkWarning } from '../interfaces';

function collectLinkSources(htmlSource: string): string[] {
  const htmlDocument = new DOMParser().parseFromString(htmlSource, 'text/html');

  return Array.from(
    new Set([
      ...collectRenderedLinkSources(htmlDocument),
      ...collectSourceFactLinkSources(htmlDocument),
    ])
  );
}

function collectRenderedLinkSources(htmlDocument: Document): string[] {
  return Array.from(
    htmlDocument.querySelectorAll<HTMLElement>(`[${OBSIDIAN_LINK_SOURCE_ATTRIBUTE}]`)
  )
    .map((element) => element.getAttribute(OBSIDIAN_LINK_SOURCE_ATTRIBUTE)?.trim() ?? '')
    .filter((linkText) => linkText.length > 0);
}

function collectSourceFactLinkSources(htmlDocument: Document): string[] {
  const sourceFactTemplate = htmlDocument.querySelector<HTMLTemplateElement>(
    `template[${PROTECTED_MARKER_ATTRIBUTE}="markdown-source-facts"]`
  );

  const sourceFactText = sourceFactTemplate?.content.textContent;

  if (!sourceFactText) {
    return [];
  }

  try {
    const sourceFacts = JSON.parse(sourceFactText) as MarkdownSourceFacts;

    return sourceFacts.facts
      .filter((sourceFact) => sourceFact.type === 'wikilink' || sourceFact.type === 'embed')
      .map((sourceFact) => sourceFact.text.trim())
      .filter((linkText) => linkText.length > 0);
  } catch {
    return [];
  }
}

export function collectObsidianLinkWarnings(
  htmlSource: string,
  resolver: ObsidianLinkTargetResolver
): ReadonlyArray<ObsidianLinkWarning> {
  return collectLinkSources(htmlSource).flatMap((linkText) => {
    const linkParts = parseObsidianWikiLinkSource(linkText);

    if (!linkParts) {
      return [];
    }

    return createObsidianLinkWarnings(linkText, linkParts, resolver);
  });
}
