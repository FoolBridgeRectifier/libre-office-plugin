import type { OfficeRuntimeExecutionResult } from '../office-runtime/interfaces';
import type {
  RichDocumentMapping,
  RichDocumentStore,
  RichDocumentVaultAdapter,
} from '../rich-documents/interfaces';

export type ConversionFormat = 'html' | 'odt';

export interface ConversionCommand {
  readonly argumentsList: ReadonlyArray<string>;
  readonly executablePath: string;
}

export interface ConversionProcess {
  executeFile(
    executablePath: string,
    argumentsList: ReadonlyArray<string>,
    timeoutMs: number
  ): Promise<OfficeRuntimeExecutionResult>;
  launchFile?(
    executablePath: string,
    argumentsList: ReadonlyArray<string>,
    timeoutMs: number
  ): Promise<void>;
}

export interface DesktopConversionRuntime {
  readonly executablePath: string;
  readonly process: ConversionProcess;
}

export interface DesktopConversionPaths {
  readonly folderPath: string;
  readonly htmlPath: string;
  readonly odtPath: string;
}

export interface DesktopConversionOptions {
  readonly getCurrentTimestamp?: () => string;
  readonly mapping: RichDocumentMapping;
  readonly richDocumentStore: RichDocumentStore;
  readonly runtime: DesktopConversionRuntime | null;
  readonly vaultAdapter: RichDocumentVaultAdapter;
}

export interface OdtSaveDetectionOptions {
  readonly mapping: RichDocumentMapping;
  readonly vaultAdapter: RichDocumentVaultAdapter;
}

export interface OdtSaveDetectionResult {
  readonly hasSavedOdtChange: boolean;
}

export interface HtmlSanitizationResult {
  readonly htmlSource: string;
  readonly removedUnsafeContent: boolean;
}
