import { createRichDocumentMapping } from '../../../rich-documents/helpers';
import { createRichDocumentEditorViewOptions } from './options';
import {
  createDefaultDesktopConversionRuntime,
  ensureDesktopOdtSource,
  openDesktopOdtSource,
} from '../../../conversion/conversion';
import type { TFile } from 'obsidian';
import type { DesktopConversionRuntime } from '../../../conversion/interfaces';
import type { OfficeRuntimeSetupState } from '../../../office-runtime/interfaces';

jest.mock('../../../conversion/conversion', () => ({
  createDefaultDesktopConversionRuntime: jest.fn(),
  ensureDesktopOdtSource: jest.fn(async () => undefined),
  openDesktopOdtSource: jest.fn(async () => undefined),
  syncDesktopOdtSave: jest.fn(),
}));

jest.mock('../../../helpers', () => ({
  resolveRichDocumentConflict: jest.fn(),
  saveRichDocumentHtml: jest.fn(),
  syncMarkdownMirror: jest.fn(),
}));

jest.mock('../../../helpers/rich-html/richHtml', () => ({
  getInitialRichDocumentAutosaveStatus: jest.fn(),
  loadRichDocumentHtmlForStore: jest.fn(),
}));

jest.mock('../../../markdown-sync/helpers', () => ({
  convertMarkdownToHtmlWithObsidianRenderer: jest.fn(),
  renderMarkdownWithObsidian: jest.fn(),
}));

jest.mock('../../../obsidian-links/helpers/resolver/resolver', () => ({
  collectObsidianLinkWarningsForApp: jest.fn(() => []),
}));

test('prepares desktop ODT source headlessly without opening LibreOffice on note load', async () => {
  const mapping = createRichDocumentMapping('Note.md', 'rich-note', '2026-06-06', 'desktop');
  const vaultAdapter = { exists: jest.fn() };
  const runtime = createRuntime();

  const richDocumentStore = {
    getMappingByMarkdownPath: jest.fn(async () => mapping),
  };

  jest.mocked(createDefaultDesktopConversionRuntime).mockResolvedValue(runtime);

  const options = createRichDocumentEditorViewOptions(
    { vault: { adapter: vaultAdapter } } as never,
    richDocumentStore as never,
    () => createReadyRuntimeState(),
    () => ({
      autosaveIntervalSeconds: 5,
      conflictBehavior: 'manual',
      editorMode: 'automatic',
      libreOfficePath: '',
      markdownSyncIntervalSeconds: 30,
      pageLayout: 'pageless',
      showMarkdownSourceFallback: true,
    }),
    () => 'desktop-odt'
  );

  await options.prepareDesktopSource?.({ path: 'Note.md' } as TFile);

  expect(ensureDesktopOdtSource).toHaveBeenCalledWith({
    mapping,
    richDocumentStore,
    runtime,
    vaultAdapter,
  });

  expect(openDesktopOdtSource).not.toHaveBeenCalled();
});

function createRuntime(): DesktopConversionRuntime {
  return {
    executablePath: 'soffice',
    process: {
      executeFile: jest.fn(),
    },
  };
}

function createReadyRuntimeState(): OfficeRuntimeSetupState {
  return {
    executablePath: 'soffice',
    isBlocking: false,
    message: 'LibreOffice ready from bundled runtime.',
    source: 'bundled',
    status: 'ready',
    version: 'LibreOffice 26.2.1.2',
  };
}
