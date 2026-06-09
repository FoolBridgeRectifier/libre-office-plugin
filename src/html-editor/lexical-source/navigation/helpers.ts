import {
  EXTERNAL_LINK_SELECTOR,
  FOOTNOTE_LINK_SELECTOR,
  INTERNAL_LINK_SELECTOR,
  NAVIGATION_CODE_SELECTOR,
  SAFE_EXTERNAL_URL_PROTOCOLS,
  TAG_SELECTOR,
} from './constants';
import {
  OBSIDIAN_LINK_SOURCE_ATTRIBUTE,
  OBSIDIAN_TAG_SOURCE_ATTRIBUTE,
} from '../../../obsidian-links/constants';
import { parseObsidianWikiLinkSource } from '../../../obsidian-links';
import { isInsideProtectedContent } from '../source-html';

function getNavigationElement(eventTarget: EventTarget | null, selector: string) {
  return eventTarget instanceof Element ? eventTarget.closest<HTMLElement>(selector) : null;
}

function isInsideNavigationBlockedContent(eventTarget: EventTarget | null): boolean {
  return (
    isInsideProtectedContent(eventTarget) ||
    (eventTarget instanceof Element && eventTarget.closest(NAVIGATION_CODE_SELECTOR) !== null)
  );
}

function findElementById(rootElement: ParentNode | null | undefined, targetId: string) {
  return Array.from(rootElement?.querySelectorAll<HTMLElement>('[id]') ?? []).find(
    (element) => element.id === targetId
  );
}

export function getInternalLinkTarget(eventTarget: EventTarget | null): string | null {
  if (isInsideNavigationBlockedContent(eventTarget)) {
    return null;
  }

  const linkElement = getNavigationElement(eventTarget, INTERNAL_LINK_SELECTOR);
  const storedSource = linkElement?.getAttribute(OBSIDIAN_LINK_SOURCE_ATTRIBUTE);
  const parsedSource = storedSource ? parseObsidianWikiLinkSource(storedSource) : null;

  return parsedSource?.target ?? linkElement?.getAttribute('data-href')?.trim() ?? null;
}

export function getTagText(eventTarget: EventTarget | null): string | null {
  if (isInsideNavigationBlockedContent(eventTarget)) {
    return null;
  }

  const tagElement = getNavigationElement(eventTarget, TAG_SELECTOR);
  const tagText =
    tagElement?.getAttribute(OBSIDIAN_TAG_SOURCE_ATTRIBUTE) ?? tagElement?.textContent ?? '';

  return tagText.trim() || null;
}

export function getSafeExternalUrl(eventTarget: EventTarget | null): string | null {
  if (isInsideNavigationBlockedContent(eventTarget)) {
    return null;
  }

  const linkElement = getNavigationElement(eventTarget, EXTERNAL_LINK_SELECTOR);
  const hrefValue = linkElement?.getAttribute('href')?.trim() ?? '';

  if (
    !linkElement ||
    linkElement.matches(INTERNAL_LINK_SELECTOR) ||
    linkElement.matches(TAG_SELECTOR)
  ) {
    return null;
  }

  try {
    const url = new URL(hrefValue);

    return SAFE_EXTERNAL_URL_PROTOCOLS.some((protocol) => protocol === url.protocol)
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function focusFootnoteTarget(eventTarget: EventTarget | null): HTMLElement | null {
  if (isInsideNavigationBlockedContent(eventTarget)) {
    return null;
  }

  const linkElement = getNavigationElement(eventTarget, FOOTNOTE_LINK_SELECTOR);
  const encodedTargetId = linkElement?.getAttribute('href')?.slice(1) ?? '';
  const targetId = decodeURIComponent(encodedTargetId);

  const editorElement = linkElement?.closest('[contenteditable="true"]');
  const targetElement = targetId ? findElementById(editorElement, targetId) : null;

  if (!targetElement) {
    return null;
  }

  if (!targetElement.hasAttribute('tabindex')) {
    targetElement.setAttribute('tabindex', '-1');
  }

  targetElement.focus({ preventScroll: true });

  targetElement.scrollIntoView({ block: 'center', inline: 'nearest' });

  return targetElement;
}
