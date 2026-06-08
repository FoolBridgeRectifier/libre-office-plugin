import { Component, MarkdownRenderer } from 'obsidian';
import type { App } from 'obsidian';

import { MARKDOWN_IMPORT_ARTICLE_ATTRIBUTE, MARKDOWN_IMPORT_ARTICLE_CLASS } from '../../constants';
import { annotateAttachmentHtml, annotateTableHtml } from '../../../attachments';
import { annotateObsidianLinkHtml } from '../../../obsidian-links';
import { splitFrontmatter } from '../markdown';
import { collectMarkdownSourceFacts } from '../source-facts/sourceFacts';
import { annotateStructuredMarkdownHtml } from '../structured-blocks/structuredBlocks';
import { splitMarkdownIntoRenderedChunks } from './chunks/chunks';
import { createFrontmatterTemplate, createProtectedJsonTemplate, escapeHtml } from './helpers';
import { mapRenderedMarkdownElementToHtml } from '.';
import { maskRemoteMarkdownImageSources } from './remote-images/remoteImages';
import type {
  MarkdownBodyRenderer,
  MarkdownToHtmlResult,
  RenderedMarkdownToHtmlOptions,
} from '../../interfaces';

export async function renderMarkdownWithObsidian(
  app: App,
  bodyMarkdown: string,
  containerElement: HTMLElement,
  sourcePath: string
): Promise<void> {
  const renderComponent = new Component();
  renderComponent.load();

  try {
    await MarkdownRenderer.render(app, bodyMarkdown, containerElement, sourcePath, renderComponent);
  } finally {
    renderComponent.unload();
  }
}

async function renderMarkdownBodyToHtml(
  bodyMarkdown: string,
  sourcePath: string,
  markdownRenderer: MarkdownBodyRenderer
): Promise<string> {
  const renderContainerElement = document.createElement('div');

  await markdownRenderer(bodyMarkdown, renderContainerElement, sourcePath);

  return mapRenderedMarkdownElementToHtml(renderContainerElement);
}

function createProtectedRawMarkdownFallback(bodyMarkdown: string): string {
  if (!bodyMarkdown.trim()) {
    return '';
  }

  return `<pre data-libre-protected="raw-markdown">${escapeHtml(bodyMarkdown)}</pre>`;
}

async function createRenderedOrFallbackBodyHtml(
  bodyMarkdown: string,
  sourcePath: string,
  markdownRenderer?: MarkdownBodyRenderer
): Promise<string> {
  if (!markdownRenderer) {
    return createProtectedRawMarkdownFallback(bodyMarkdown);
  }

  const renderableBodyMarkdown = maskRemoteMarkdownImageSources(bodyMarkdown);

  const renderedBodyHtml = await renderMarkdownBodyToHtml(
    renderableBodyMarkdown,
    sourcePath,
    markdownRenderer
  );

  if (renderedBodyHtml.trim() || !bodyMarkdown.trim()) {
    return renderedBodyHtml;
  }

  const renderedChunkHtml = (
    await Promise.all(
      splitMarkdownIntoRenderedChunks(bodyMarkdown).map((markdownChunk) =>
        renderMarkdownBodyToHtml(
          maskRemoteMarkdownImageSources(markdownChunk),
          sourcePath,
          markdownRenderer
        )
      )
    )
  )
    .filter((htmlChunk) => htmlChunk.trim())
    .join('\n');

  if (renderedChunkHtml.trim()) {
    return renderedChunkHtml;
  }

  return createProtectedRawMarkdownFallback(bodyMarkdown);
}

export async function convertMarkdownToHtmlWithObsidianRenderer(
  markdownSource: string,
  options: RenderedMarkdownToHtmlOptions
): Promise<MarkdownToHtmlResult> {
  const frontmatterSplitResult = splitFrontmatter(markdownSource);
  const sourceFacts = collectMarkdownSourceFacts(markdownSource);

  const bodyHtml = await createRenderedOrFallbackBodyHtml(
    frontmatterSplitResult.bodyMarkdown,
    options.sourcePath,
    options.markdownRenderer
  );

  const linkAnnotatedBodyHtml = annotateObsidianLinkHtml(bodyHtml, sourceFacts.facts);

  const attachmentAnnotatedBodyHtml = annotateAttachmentHtml(
    linkAnnotatedBodyHtml,
    sourceFacts.facts
  );

  const tableAnnotatedBodyHtml = annotateTableHtml(attachmentAnnotatedBodyHtml);

  const annotatedBodyHtml = annotateStructuredMarkdownHtml(
    tableAnnotatedBodyHtml,
    sourceFacts.facts
  );

  const frontmatterTemplate = createFrontmatterTemplate(frontmatterSplitResult.frontmatter);
  const sourceFactsTemplate = createProtectedJsonTemplate('markdown-source-facts', sourceFacts);

  const htmlSource = `<article ${MARKDOWN_IMPORT_ARTICLE_ATTRIBUTE} class="${MARKDOWN_IMPORT_ARTICLE_CLASS}">${frontmatterTemplate}${sourceFactsTemplate}${annotatedBodyHtml}</article>`;

  return {
    bodyHtml: annotatedBodyHtml,
    frontmatter: frontmatterSplitResult.frontmatter,
    htmlSource,
  };
}
