import { OBSIDIAN_LINK_SOURCE_ATTRIBUTE } from '../constants';
import { parseObsidianWikiLinkSource } from '../helpers';
import { PROTECTED_MARKER_ATTRIBUTE } from '../../markdown-sync/constants';
import type { MarkdownSourceFacts } from '../../markdown-sync/markdown/source-facts/interfaces';
import type {
  ObsidianLinkTargetResolver,
  ObsidianLinkWarning,
  ObsidianWikiLinkParts,
} from '../interfaces';

function parseHeadingTarget(target: string) {
  if (!target.includes('#') || target.includes('#^')) {
    return null;
  }

  const [targetNote, targetHeading] = target.split('#');

  return targetHeading ? { targetHeading, targetNote: targetNote ?? '' } : null;
}

function parseBlockTarget(target: string) {
  if (!target.includes('#^')) {
    return null;
  }

  const [targetNote, targetBlockId] = target.split('#^');

  return targetBlockId ? { targetBlockId, targetNote: targetNote ?? '' } : null;
}

function createHeadingWarning(
  linkText: string,
  linkParts: ObsidianWikiLinkParts,
  resolver: ObsidianLinkTargetResolver
): ObsidianLinkWarning | null {
  const headingTarget = parseHeadingTarget(linkParts.target);

  if (!headingTarget) {
    return null;
  }

  const targetCache = resolver.resolveTarget(headingTarget.targetNote);

  if (!targetCache || targetCache.headings.includes(headingTarget.targetHeading)) {
    return null;
  }

  return {
    linkText,
    targetNote: headingTarget.targetNote,
    targetValue: headingTarget.targetHeading,
    type: 'missing-heading-target',
  };
}

function createBlockWarning(
  linkText: string,
  linkParts: ObsidianWikiLinkParts,
  resolver: ObsidianLinkTargetResolver
): ObsidianLinkWarning | null {
  const blockTarget = parseBlockTarget(linkParts.target);

  if (!blockTarget) {
    return null;
  }

  const targetCache = resolver.resolveTarget(blockTarget.targetNote);

  if (!targetCache || targetCache.blockIds.includes(blockTarget.targetBlockId)) {
    return null;
  }

  return {
    linkText,
    targetNote: blockTarget.targetNote,
    targetValue: blockTarget.targetBlockId,
    type: 'missing-block-target',
  };
}

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

    return [
      createHeadingWarning(linkText, linkParts, resolver),
      createBlockWarning(linkText, linkParts, resolver),
    ].filter((warning): warning is ObsidianLinkWarning => warning !== null);
  });
}
