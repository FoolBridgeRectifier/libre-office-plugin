import {
  DEFAULT_HTML_AUTOSAVE_INTERVAL_MS,
  DEFAULT_MARKDOWN_SYNC_INTERVAL_MS,
  DEFAULT_RETRY_DELAY_MS,
  FRONTMATTER_BLOCK_TEMPLATE,
} from './constants';
import { convertHtmlToMarkdownMirror } from './helpers/markdown/markdown';
import { splitFrontmatter } from '../markdown-sync/helpers';
import type { AutosaveControllerOptions, AutosaveTimerHandle } from './interfaces';

export function clearAutosaveTimer(timerHandle: AutosaveTimerHandle | null): void {
  if (timerHandle !== null) {
    clearTimeout(timerHandle);
  }
}

export function getAutosaveTiming(options: AutosaveControllerOptions) {
  return {
    htmlAutosaveIntervalMs: options.htmlAutosaveIntervalMs ?? DEFAULT_HTML_AUTOSAVE_INTERVAL_MS,
    markdownSyncIntervalMs: options.markdownSyncIntervalMs ?? DEFAULT_MARKDOWN_SYNC_INTERVAL_MS,
    retryDelayMs: options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS,
  };
}

export { convertHtmlToMarkdownMirror };

export function createMarkdownMirrorSource(
  currentMarkdownSource: string,
  htmlSource: string
): string {
  const { frontmatter } = splitFrontmatter(currentMarkdownSource);
  const bodyMarkdown = convertHtmlToMarkdownMirror(htmlSource);

  if (frontmatter === null) {
    return bodyMarkdown;
  }

  return FRONTMATTER_BLOCK_TEMPLATE.replace('{frontmatter}', frontmatter).replace(
    '{bodyMarkdown}',
    bodyMarkdown
  );
}
