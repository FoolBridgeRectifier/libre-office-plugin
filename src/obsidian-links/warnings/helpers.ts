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

function parseNoteTarget(target: string): string | null {
  const targetNote = target.split('#')[0]?.trim() ?? '';

  return targetNote.length > 0 ? targetNote : null;
}

function createNoteWarning(
  linkText: string,
  linkParts: ObsidianWikiLinkParts,
  resolver: ObsidianLinkTargetResolver
): ObsidianLinkWarning | null {
  const targetNote = parseNoteTarget(linkParts.target);

  if (!targetNote || resolver.resolveTarget(targetNote)) {
    return null;
  }

  return {
    linkText,
    targetNote,
    targetValue: targetNote,
    type: 'missing-note-target',
  };
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

export function createObsidianLinkWarnings(
  linkText: string,
  linkParts: ObsidianWikiLinkParts,
  resolver: ObsidianLinkTargetResolver
): ReadonlyArray<ObsidianLinkWarning> {
  const noteWarning = createNoteWarning(linkText, linkParts, resolver);

  if (noteWarning) {
    return [noteWarning];
  }

  return [
    createHeadingWarning(linkText, linkParts, resolver),
    createBlockWarning(linkText, linkParts, resolver),
  ].filter((warning): warning is ObsidianLinkWarning => warning !== null);
}
