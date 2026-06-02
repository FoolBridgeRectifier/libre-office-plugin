import matter from 'gray-matter';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import remarkFootnotes from 'remark-footnotes';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import unified from 'unified';

import {
  FRONTMATTER_DELIMITER,
  MARKDOWN_IMPORT_ARTICLE_ATTRIBUTE,
  PROTECTED_MARKER_ATTRIBUTE,
} from '../../constants';
import { MARKDOWN_HTML_SANITIZE_SCHEMA } from './constants';
import { escapeHtml } from './helpers';
import {
  protectObsidianMarkdownSyntax,
  restoreProtectedObsidianSyntax,
} from './obsidian-syntax/helpers';
import type { FrontmatterSplitResult, MarkdownToHtmlResult } from '../../interfaces';

function createFrontmatterTemplate(frontmatter: string | null): string {
  if (frontmatter === null) {
    return '';
  }

  return `<template ${PROTECTED_MARKER_ATTRIBUTE}="frontmatter">${escapeHtml(frontmatter)}</template>`;
}

function convertMarkdownBodyToHtml(bodyMarkdown: string): string {
  const protectedMarkdown = protectObsidianMarkdownSyntax(bodyMarkdown);

  // Unified keeps parsing, tree transformation, and HTML serialization in explicit stages.
  const processedFile = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkFootnotes, { inlineNotes: true })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize, MARKDOWN_HTML_SANITIZE_SCHEMA)
    .use(rehypeStringify)
    .processSync(protectedMarkdown.markdown);

  return restoreProtectedObsidianSyntax(String(processedFile), protectedMarkdown.tokens);
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
