import { PROTECTED_MARKER_ATTRIBUTE } from '../../../constants';
import { escapeHtml } from '../helpers';
import {
  BLOCK_ID_PATTERN,
  CALLOUT_LINE_PATTERN,
  CODE_SPAN_PATTERN,
  CSS_HEX_COLOR_PATTERN,
  FENCE_PATTERN,
  OBSIDIAN_MARKDOWN_PLACEHOLDER_PREFIX,
  OBSIDIAN_MARKDOWN_PLACEHOLDER_SUFFIX,
  TAG_PATTERN,
  WIKI_LINK_PATTERN,
} from './constants';
import type {
  MarkdownFenceState,
  ObsidianLinkParts,
  ObsidianMarkdownToken,
  ObsidianMarkdownTokenKind,
} from './interfaces';
function escapeHtmlAttribute(text: string): string {
  return escapeHtml(text).split('"').join('&quot;');
}

function createProtectedHtml(
  kind: ObsidianMarkdownTokenKind,
  rawMarkdown: string,
  label: string,
  attributes: Readonly<Record<string, string>> = {}
): string {
  const protectedAttributes = Object.entries(attributes)
    .map(([name, value]) => `${name}="${escapeHtmlAttribute(value)}"`)
    .join(' ');

  const optionalAttributes = protectedAttributes ? ` ${protectedAttributes}` : '';

  return `<span ${PROTECTED_MARKER_ATTRIBUTE}="${kind}" data-libre-markdown="${escapeHtmlAttribute(rawMarkdown)}"${optionalAttributes}>${escapeHtml(label)}</span>`;
}

function splitObsidianLinkParts(rawTarget: string): ObsidianLinkParts {
  const aliasSeparatorIndex = rawTarget.search(/(?<!\\)\|/);

  if (aliasSeparatorIndex === -1) {
    return { alias: null, target: rawTarget };
  }

  return {
    alias: rawTarget.slice(aliasSeparatorIndex + 1).replace(/\\\|/g, '|'),
    target: rawTarget.slice(0, aliasSeparatorIndex).replace(/\\\|/g, '|'),
  };
}

export function createPlaceholder(tokens: ObsidianMarkdownToken[], html: string): string {
  const placeholder = `${OBSIDIAN_MARKDOWN_PLACEHOLDER_PREFIX}${tokens.length}${OBSIDIAN_MARKDOWN_PLACEHOLDER_SUFFIX}`;

  tokens.push({ html, placeholder });

  return placeholder;
}

export function readFenceState(line: string): MarkdownFenceState | null {
  const fenceMatch = FENCE_PATTERN.exec(line);

  if (!fenceMatch) {
    return null;
  }

  return {
    character: fenceMatch[1][0] as '`' | '~',
    length: fenceMatch[1].length,
  };
}

export function replaceOutsideCodeSpans(
  line: string,
  replaceText: (text: string) => string
): string {
  let result = '';
  let lastIndex = 0;

  for (const codeSpanMatch of line.matchAll(CODE_SPAN_PATTERN)) {
    result += replaceText(line.slice(lastIndex, codeSpanMatch.index));
    result += codeSpanMatch[0];
    lastIndex = codeSpanMatch.index + codeSpanMatch[0].length;
  }

  return result + replaceText(line.slice(lastIndex));
}

export function protectCalloutLine(line: string, tokens: ObsidianMarkdownToken[]): string {
  const calloutMatch = CALLOUT_LINE_PATTERN.exec(line);

  if (!calloutMatch) {
    return line;
  }

  const rawMarkdown = `[!${calloutMatch[2]}]${calloutMatch[3]}${calloutMatch[4]}`;

  const html = createProtectedHtml('obsidian-callout', rawMarkdown, rawMarkdown, {
    'data-obsidian-callout-fold': calloutMatch[3],
    'data-obsidian-callout-type': calloutMatch[2].toLowerCase(),
  });

  return `${calloutMatch[1]}${createPlaceholder(tokens, html)}`;
}

export function protectInlineObsidianSyntax(text: string, tokens: ObsidianMarkdownToken[]): string {
  const textWithLinks = text.replace(WIKI_LINK_PATTERN, (rawMarkdown, embedMarker, rawTarget) => {
    const linkParts = splitObsidianLinkParts(rawTarget);
    const kind = embedMarker ? 'obsidian-embed' : 'obsidian-wiki-link';
    const label = embedMarker ? rawMarkdown : (linkParts.alias ?? linkParts.target);

    const html = createProtectedHtml(kind, rawMarkdown, label, {
      'data-obsidian-target': linkParts.target,
    });

    return createPlaceholder(tokens, html);
  });

  const textWithTags = textWithLinks.replace(TAG_PATTERN, (rawMarkdown, prefix, tagName) => {
    if (CSS_HEX_COLOR_PATTERN.test(tagName)) {
      return rawMarkdown;
    }

    const tagMarkdown = `#${tagName}`;
    const html = createProtectedHtml('obsidian-tag', tagMarkdown, tagMarkdown, {
      'data-obsidian-tag': tagName,
    });

    return `${prefix}${createPlaceholder(tokens, html)}`;
  });

  return textWithTags.replace(BLOCK_ID_PATTERN, (rawMarkdown, prefix, blockId) => {
    const blockMarkdown = `^${blockId}`;
    const html = createProtectedHtml('obsidian-block-id', blockMarkdown, blockMarkdown, {
      'data-obsidian-block-id': blockId,
    });

    return `${prefix}${createPlaceholder(tokens, html)}`;
  });
}

export function restoreProtectedObsidianSyntax(
  html: string,
  tokens: readonly ObsidianMarkdownToken[]
): string {
  return tokens.reduce(
    (restoredHtml, token) => restoredHtml.split(token.placeholder).join(token.html),
    html
  );
}
