import type { App as ObsidianApp, EventRef, TAbstractFile, TFile } from 'obsidian';

import type { AutosaveStatus } from './autosave/interfaces';
import type { ConflictResolutionChoice } from './conflicts/interfaces';
import type { OfficeRuntimeSetupState } from './office-runtime/interfaces';
import type { RichDocumentStore, RichDocumentVaultAdapter } from './rich-documents/interfaces';

export interface AppProps {
  readonly activeFilePath?: string | null;
  readonly autosaveStatus?: AutosaveStatus;
  readonly importedHtmlSource?: string | null;
  readonly isResolvingConflict?: boolean;
  readonly linkWarningCount?: number;
  readonly officeRuntimeSetupState?: OfficeRuntimeSetupState;
  readonly onEditorBlur?: () => void;
  readonly onHtmlSourceChange?: (htmlSource: string) => void;
  readonly onResolveConflict?: (choice: ConflictResolutionChoice) => void;
}

export interface RichDocumentMappingEventPlugin {
  readonly app: {
    readonly vault: {
      on(
        eventName: 'rename',
        callback: (file: TAbstractFile, previousPath: string) => unknown
      ): EventRef;
      on(eventName: 'delete', callback: (file: TAbstractFile) => unknown): EventRef;
    };
  };
  registerEvent(eventRef: EventRef): void;
}

export interface RichDocumentSourceWriteOptions {
  readonly htmlSource: string;
  readonly markdownPath: string;
  readonly richDocumentStore: RichDocumentStore;
  readonly vaultAdapter: RichDocumentVaultAdapter;
}

export interface RichDocumentHtmlSaveOptions extends RichDocumentSourceWriteOptions {
  readonly previousHtmlSource: string;
}

export interface RichDocumentHtmlLoadOptions {
  readonly app: ObsidianApp;
  readonly file: TFile;
  readonly richDocumentStore: RichDocumentStore;
}
