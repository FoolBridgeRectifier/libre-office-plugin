import type { EventRef, TAbstractFile } from 'obsidian';

export interface AppProps {
  readonly activeFilePath?: string | null;
  readonly importedHtmlSource?: string | null;
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
