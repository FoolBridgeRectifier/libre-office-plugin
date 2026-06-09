import { ACTIVATION_KEYS } from './constants';
import {
  focusFootnoteTarget,
  getInternalLinkTarget,
  getSafeExternalUrl,
  getTagText,
} from './helpers';
import type {
  NavigationHandlerInputs,
  NavigationInteractionOptions,
  NavigationKeyboardEvent,
  NavigationMouseEvent,
} from './interfaces';

export function createNavigationInteractionOptions(
  handlers: NavigationHandlerInputs
): NavigationInteractionOptions {
  return {
    ...(handlers.onExternalLinkNavigate
      ? { onExternalLinkNavigate: handlers.onExternalLinkNavigate }
      : {}),
    ...(handlers.onInternalLinkNavigate
      ? { onInternalLinkNavigate: handlers.onInternalLinkNavigate }
      : {}),
    ...(handlers.onTagNavigate ? { onTagNavigate: handlers.onTagNavigate } : {}),
  };
}

function stopNavigationEvent(event: NavigationKeyboardEvent | NavigationMouseEvent): void {
  event.preventDefault();
  event.stopPropagation();
}

function handleNavigationTarget(
  event: NavigationKeyboardEvent | NavigationMouseEvent,
  options: NavigationInteractionOptions
): boolean {
  if (focusFootnoteTarget(event.target)) {
    stopNavigationEvent(event);

    return true;
  }

  const internalLinkTarget = getInternalLinkTarget(event.target);

  if (internalLinkTarget && options.onInternalLinkNavigate) {
    stopNavigationEvent(event);
    options.onInternalLinkNavigate(internalLinkTarget);

    return true;
  }

  const tagText = getTagText(event.target);

  if (tagText && options.onTagNavigate) {
    stopNavigationEvent(event);
    options.onTagNavigate(tagText);

    return true;
  }

  const externalUrl = getSafeExternalUrl(event.target);

  if (externalUrl && options.onExternalLinkNavigate) {
    stopNavigationEvent(event);
    options.onExternalLinkNavigate(externalUrl);

    return true;
  }

  return false;
}

function handleExternalNavigationTarget(
  event: NavigationMouseEvent,
  options: NavigationInteractionOptions
): string | null {
  const externalUrl = getSafeExternalUrl(event.target);

  if (externalUrl && options.onExternalLinkNavigate) {
    stopNavigationEvent(event);
    options.onExternalLinkNavigate(externalUrl);

    return externalUrl;
  }

  return null;
}

export function handleEditorNavigationClick(
  event: NavigationMouseEvent,
  options: NavigationInteractionOptions
): void {
  handleNavigationTarget(event, options);
}

export function handlePairedExternalNavigationClick(
  event: NavigationMouseEvent,
  externalUrl: string | null
): boolean {
  if (!externalUrl || getSafeExternalUrl(event.target) !== externalUrl) {
    return false;
  }

  stopNavigationEvent(event);

  return true;
}

export function handleEditorNavigationMouseDown(
  event: NavigationMouseEvent,
  options: NavigationInteractionOptions
): string | null {
  return handleExternalNavigationTarget(event, options);
}

export function handleEditorNavigationKeyDown(
  event: NavigationKeyboardEvent,
  options: NavigationInteractionOptions
): void {
  if (!ACTIVATION_KEYS.some((activationKey) => activationKey === event.key)) {
    return;
  }

  handleNavigationTarget(event, options);
}
