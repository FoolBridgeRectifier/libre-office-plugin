import matter from 'gray-matter';

import { FRONTMATTER_DELIMITER } from '../constants';
import type { FrontmatterSplitResult } from '../interfaces';

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
