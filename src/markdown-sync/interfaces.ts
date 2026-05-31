import type { TFile } from 'obsidian';

import type {
  RichDocumentMapping,
  RichDocumentStore,
  RichDocumentVaultAdapter,
} from '../rich-documents/interfaces';

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

export interface MarkdownVaultReader {
  read(file: TFile): Promise<string>;
}

export interface MarkdownItObsidianImagesOptions {
  readonly baseURL?: string;
  readonly htmlAttributes?: Readonly<Record<string, string>>;
  readonly makeAllLinksAbsolute?: boolean;
  readonly postProcessLabel?: (label: string) => string;
  readonly postProcessPageName?: (pageName: string) => string;
  readonly relativeBaseURL?: string;
  readonly uriSuffix?: string;
}

export interface MarkdownItObsidianWikilinksOptions {
  readonly baseURL?: string;
  readonly htmlAttributes?: Readonly<Record<string, string>>;
  readonly makeAllLinksAbsolute?: boolean;
  readonly postProcessLabel?: (label: string) => string;
  readonly postProcessPagePath?: (pagePath: string) => string;
  readonly relativeBaseURL?: string;
  readonly stripHashFromLabel?: boolean;
  readonly uriSuffix?: string;
}

export interface MarkdownItTaskListsOptions {
  readonly enabled?: boolean;
  readonly label?: boolean;
  readonly labelAfter?: boolean;
}
