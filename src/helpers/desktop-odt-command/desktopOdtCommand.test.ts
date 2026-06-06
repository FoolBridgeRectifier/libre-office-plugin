import {
  createMarkdownFile,
  createVaultMock,
  createWorkspaceMock,
  mockDesktopConversionRuntime,
  mockMapping,
  mockOfficeRuntimeSetupState,
  mockRichDocumentStore,
} from '../../mainTestHelpers';
import {
  createDefaultDesktopConversionRuntime,
  ensureDesktopOdtSource,
  openDesktopOdtSource,
} from '../../conversion/conversion';
import { OPEN_DESKTOP_ODT_COMMAND_ID } from '../../editor-view/constants';
import { loadRichDocumentHtmlForStore } from '../rich-html/richHtml';
import { registerOpenDesktopOdtCommand } from './desktopOdtCommand';
import type { DesktopOdtCommandTarget } from './interfaces';

jest.mock('../rich-html/richHtml', () => ({
  loadRichDocumentHtmlForStore: jest.fn(async () => '<article>Imported</article>'),
}));

test('opens active markdown ODT in bundled LibreOffice from explicit command', async () => {
  const workspace = createWorkspaceMock();
  const vault = createVaultMock();
  const { addCommand, target } = createCommandTarget(vault, workspace);

  workspace.getActiveFile.mockReturnValue(createMarkdownFile('Desktop.md'));

  registerOpenDesktopOdtCommand({
    getOfficeRuntimeSetupState: () => mockOfficeRuntimeSetupState,
    getRichDocumentStore: () => mockRichDocumentStore,
    target,
  });

  const command = addCommand.mock.calls.find(
    ([registeredCommand]) => registeredCommand.id === OPEN_DESKTOP_ODT_COMMAND_ID
  )?.[0] as { checkCallback(checking: boolean): boolean };

  expect(command.checkCallback(true)).toBe(true);
  expect(command.checkCallback(false)).toBe(true);

  await flushPromises();

  expect(loadRichDocumentHtmlForStore).toHaveBeenCalledWith(
    target.app,
    createMarkdownFile('Desktop.md'),
    mockRichDocumentStore
  );

  expect(createDefaultDesktopConversionRuntime).toHaveBeenCalledWith(mockOfficeRuntimeSetupState);

  expect(ensureDesktopOdtSource).toHaveBeenCalledWith({
    mapping: mockMapping,
    richDocumentStore: mockRichDocumentStore,
    runtime: mockDesktopConversionRuntime,
    vaultAdapter: vault.adapter,
  });

  expect(openDesktopOdtSource).toHaveBeenCalledWith({
    mapping: mockMapping,
    richDocumentStore: mockRichDocumentStore,
    runtime: mockDesktopConversionRuntime,
    vaultAdapter: vault.adapter,
  });
});

test('does not open LibreOffice when bundled runtime is missing', async () => {
  const workspace = createWorkspaceMock();
  const vault = createVaultMock();
  const { addCommand, target } = createCommandTarget(vault, workspace);

  workspace.getActiveFile.mockReturnValue(createMarkdownFile('Missing.md'));
  jest.mocked(createDefaultDesktopConversionRuntime).mockResolvedValueOnce(null);

  registerOpenDesktopOdtCommand({
    getOfficeRuntimeSetupState: () => mockOfficeRuntimeSetupState,
    getRichDocumentStore: () => mockRichDocumentStore,
    target,
  });

  const command = addCommand.mock.calls[0]?.[0] as {
    checkCallback(checking: boolean): boolean;
  };

  expect(command.checkCallback(false)).toBe(true);

  await flushPromises();

  expect(loadRichDocumentHtmlForStore).toHaveBeenCalledWith(
    target.app,
    createMarkdownFile('Missing.md'),
    mockRichDocumentStore
  );

  expect(ensureDesktopOdtSource).not.toHaveBeenCalled();
  expect(openDesktopOdtSource).not.toHaveBeenCalled();
});

function createCommandTarget(
  vault: ReturnType<typeof createVaultMock>,
  workspace: ReturnType<typeof createWorkspaceMock>
): {
  readonly addCommand: jest.Mock;
  readonly target: DesktopOdtCommandTarget;
} {
  const addCommand = jest.fn();
  const target = { addCommand, app: { vault, workspace } } as unknown as DesktopOdtCommandTarget;

  return { addCommand, target };
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}
