import type { App, Plugin, TFile } from 'obsidian';

import type { OfficeRuntimeSetupState } from '../office-runtime/interfaces';
import type { RichDocumentStore } from '../rich-documents/interfaces';

export interface DesktopOdtCommandTarget {
  readonly app: App;
  addCommand(command: Parameters<Plugin['addCommand']>[0]): void;
}

export interface DesktopOdtCommandOptions {
  readonly getOfficeRuntimeSetupState: () => OfficeRuntimeSetupState;
  readonly getRichDocumentStore: () => RichDocumentStore | null;
  readonly target: DesktopOdtCommandTarget;
}

export interface DesktopOdtOpenOptions {
  readonly file: TFile;
  readonly getOfficeRuntimeSetupState: () => OfficeRuntimeSetupState;
  readonly richDocumentStore: RichDocumentStore;
  readonly target: DesktopOdtCommandTarget;
}
