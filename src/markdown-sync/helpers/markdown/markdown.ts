import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import markdownItGithubAlertsPlugin from 'markdown-it-github-alerts';
import markdownItFootnotePlugin from 'markdown-it-footnote';
import createObsidianImagesPlugin from 'markdown-it-obsidian-images';
import createObsidianWikilinksPlugin from 'markdown-it-obsidian-wikilinks';
import markdownItTaskListsPlugin from 'markdown-it-task-lists';

import {
  FRONTMATTER_DELIMITER,
  GITHUB_ALERT_CLASS_NAME,
  MARKDOWN_IMPORT_ARTICLE_ATTRIBUTE,
  PROTECTED_MARKER_ATTRIBUTE,
} from '../../constants';
import type { FrontmatterSplitResult, MarkdownToHtmlResult } from '../../interfaces';

function escapeHtml(text: string): string {
  return text.split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;');
}

function createFrontmatterTemplate(frontmatter: string | null): string {
  if (frontmatter === null) {
    return '';
  }

  return `<template ${PROTECTED_MARKER_ATTRIBUTE}="frontmatter">${escapeHtml(frontmatter)}</template>`;
}

function preserveObsidianPathSegment(pathSegment: string): string {
  return pathSegment.trim();
}

function createObsidianLinkPlugin() {
  return createObsidianWikilinksPlugin({
    postProcessLabel: preserveObsidianPathSegment,
    postProcessPagePath: preserveObsidianPathSegment,
    relativeBaseURL: '',
    uriSuffix: '',
  });
}

function createObsidianImagePlugin() {
  return createObsidianImagesPlugin({
    postProcessLabel: preserveObsidianPathSegment,
    postProcessPageName: preserveObsidianPathSegment,
    relativeBaseURL: '',
    uriSuffix: '',
  });
}

function createMarkdownRenderer(): MarkdownIt {
  return new MarkdownIt({ html: false, linkify: true })
    .use(createObsidianImagePlugin())
    .use(createObsidianLinkPlugin())
    .use(markdownItFootnotePlugin)
    .use(markdownItTaskListsPlugin, { enabled: true })
    .use(markdownItGithubAlertsPlugin, {
      classPrefix: GITHUB_ALERT_CLASS_NAME,
      icons: { caution: '', important: '', note: '', tip: '', warning: '' },
    });
}

function convertMarkdownBodyToHtml(bodyMarkdown: string): string {
  // Markdown-it owns CommonMark/GFM parsing; plugins cover Obsidian links, embeds, and alerts.
  const markdownRenderer = createMarkdownRenderer();

  return markdownRenderer.render(bodyMarkdown);
}

export function splitFrontmatter(markdownSource: string): FrontmatterSplitResult {
  const parsedFile = matter(markdownSource, {
    delimiters: FRONTMATTER_DELIMITER,
  });

  // Invalid frontmatter is treated as regular markdown so user text is not discarded.
  if (typeof parsedFile.data !== 'object' || parsedFile.data === null) {
    return { bodyMarkdown: markdownSource, frontmatter: null };
  }

  if (!parsedFile.matter) {
    return { bodyMarkdown: markdownSource, frontmatter: null };
  }

  return {
    bodyMarkdown: parsedFile.content,
    frontmatter: parsedFile.matter.replace(/^\r?\n/, ''),
  };
}

export function convertMarkdownToHtml(markdownSource: string): MarkdownToHtmlResult {
  const frontmatterSplitResult = splitFrontmatter(markdownSource);
  const bodyHtml = convertMarkdownBodyToHtml(frontmatterSplitResult.bodyMarkdown);
  const frontmatterTemplate = createFrontmatterTemplate(frontmatterSplitResult.frontmatter);

  return {
    bodyHtml,
    frontmatter: frontmatterSplitResult.frontmatter,
    htmlSource: `<article ${MARKDOWN_IMPORT_ARTICLE_ATTRIBUTE}>${frontmatterTemplate}${bodyHtml}</article>`,
  };
}
