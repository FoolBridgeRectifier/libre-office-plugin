import { createRichDocumentMapping } from '../../rich-documents';
import { openExternalUrl } from './helpers';
import { createRichDocumentEditorViewOptions } from './options';
import {
  createDefaultDesktopConversionRuntime,
  ensureDesktopOdtSource,
  openDesktopOdtSource,
} from '../../conversion/conversion';
import type { TFile } from 'obsidian';
import type { DesktopConversionRuntime } from '../../conversion/interfaces';
import type { OfficeRuntimeSetupState } from '../../office-runtime/interfaces';

jest.mock('../../conversion/conversion', () => ({
  createDefaultDesktopConversionRuntime: jest.fn(),
  ensureDesktopOdtSource: jest.fn(async () => undefined),
  openDesktopOdtSource: jest.fn(async () => undefined),
  syncDesktopOdtSave: jest.fn(),
}));

jest.mock('../../richDocumentWorkspace', () => ({
  resolveRichDocumentConflict: jest.fn(),
  saveRichDocumentHtml: jest.fn(),
  syncMarkdownMirror: jest.fn(),
}));

jest.mock('../../rich-html/richHtml', () => ({
  getInitialRichDocumentAutosaveStatus: jest.fn(),
  loadRichDocumentHtmlForStore: jest.fn(),
}));

jest.mock('../../markdown-sync', () => ({
  convertMarkdownToHtmlWithObsidianRenderer: jest.fn(),
  renderMarkdownWithObsidian: jest.fn(),
}));

jest.mock('../../obsidian-links/resolver/resolver', () => ({
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

test('creates Obsidian navigation delegates for links, tags, and external urls', () => {
  const linkedFile = { extension: 'md', path: 'Target.md' };
  const getFirstLinkpathDest = jest.fn(() => linkedFile);
  const openFile = jest.fn();

  const openGlobalSearch = jest.fn();
  const revealLeaf = jest.fn();
  const setQuery = jest.fn();

  const openExternalUrl = jest.fn();
  const originalOpen = globalThis.open;

  Object.defineProperty(globalThis, 'open', { configurable: true, value: openExternalUrl });

  try {
    const options = createRichDocumentEditorViewOptions(
      {
        internalPlugins: {
          getPluginById: jest.fn(() => ({ instance: { openGlobalSearch } })),
        },
        metadataCache: { getFirstLinkpathDest },
        vault: { adapter: {}, getAbstractFileByPath: jest.fn() },
        workspace: {
          getLeaf: jest.fn(() => ({ openFile })),
          getLeavesOfType: jest.fn(() => [{ view: { setQuery } }]),
          revealLeaf,
        },
      } as never,
      { getMappingByMarkdownPath: jest.fn() } as never,
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

    options.navigateInternalLink?.('Target#Heading', 'Source.md');

    options.navigateTag?.('#parent/child');

    options.openExternalLink?.('https://example.com/');

    expect(getFirstLinkpathDest).toHaveBeenCalledWith('Target', 'Source.md');

    expect(openFile).toHaveBeenCalledWith(linkedFile);

    expect(openGlobalSearch).toHaveBeenCalledWith('tag:parent/child');

    expect(setQuery).toHaveBeenCalledWith('tag:parent/child');

    expect(revealLeaf).toHaveBeenCalledWith({ view: { setQuery } });

    expect(openExternalUrl).toHaveBeenCalledWith(
      'https://example.com/',
      '_blank',
      'noopener,noreferrer'
    );
  } finally {
    Object.defineProperty(globalThis, 'open', { configurable: true, value: originalOpen });
  }
});

test('opens external urls through Electron shell when available', async () => {
  const openExternal = jest.fn(async () => undefined);
  const browserOpen = jest.fn();
  const runtimeRequire = jest.fn(() => ({ shell: { openExternal } }));

  await openExternalUrl(
    'https://example.com/native',
    runtimeRequire as unknown as NodeJS.Require,
    browserOpen
  );

  expect(runtimeRequire).toHaveBeenCalledWith('electron');
  expect(openExternal).toHaveBeenCalledWith('https://example.com/native');
  expect(browserOpen).not.toHaveBeenCalled();
});

test('falls back to browser open when Electron shell is unavailable', async () => {
  const browserOpen = jest.fn();
  const runtimeRequire = jest.fn(() => {
    throw new Error('electron unavailable');
  });

  await openExternalUrl(
    'https://example.com/fallback',
    runtimeRequire as unknown as NodeJS.Require,
    browserOpen
  );

  expect(browserOpen).toHaveBeenCalledWith(
    'https://example.com/fallback',
    '_blank',
    'noopener,noreferrer'
  );
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
