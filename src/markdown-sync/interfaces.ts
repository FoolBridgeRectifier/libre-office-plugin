import type { TFile } from 'obsidian';

import type {
  RichDocumentMapping,
  RichDocumentStore,
  RichDocumentVaultAdapter,
} from '../rich-documents/interfaces';

export type MarkdownBodyRenderer = (
  bodyMarkdown: string,
  containerElement: HTMLElement,
  sourcePath: string
) => Promise<void>;

export interface FirstMarkdownImportResult {
  readonly htmlSource: string;
  readonly imported: boolean;
  readonly mapping: RichDocumentMapping;
}

export interface FrontmatterSplitResult {
  readonly bodyMarkdown: string;
  readonly frontmatter: string | null;
}

export interface MarkdownImportOptions {
  readonly getCurrentTimestamp?: () => string;
  readonly markdownRenderer?: MarkdownBodyRenderer;
  readonly markdownFile: TFile;
  readonly mapping: RichDocumentMapping;
  readonly richDocumentStore: RichDocumentStore;
  readonly vaultAdapter: RichDocumentVaultAdapter;
  readonly vaultReader: MarkdownVaultReader;
}

export interface MarkdownToHtmlResult {
  readonly bodyHtml: string;
  readonly frontmatter: string | null;
  readonly htmlSource: string;
}

export interface RenderedMarkdownToHtmlOptions {
  readonly markdownRenderer?: MarkdownBodyRenderer;
  readonly sourcePath: string;
}

export interface MarkdownVaultReader {
  read(file: TFile): Promise<string>;
}
