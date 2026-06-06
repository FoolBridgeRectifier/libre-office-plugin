import {
  createLeaf,
  createMarkdownFile,
  createPluginMockArguments,
  createVaultMock,
  createWorkspaceMock,
  mockOfficeRuntimeSetupState,
} from './mainTestHelpers';
import { detectOfficeRuntime } from './office-runtime/officeRuntime';
import type { WorkspaceLeaf } from 'obsidian';

test('detects LibreOffice runtime from persisted configuration on load', async () => {
  const { default: LibreNoteEditorPlugin } = await import('./main');
  const workspace = createWorkspaceMock();
  const vault = createVaultMock();

  const plugin = new LibreNoteEditorPlugin(...createPluginMockArguments(vault, workspace));

  jest.mocked(plugin.loadData).mockResolvedValue({
    settings: { libreOfficePath: 'C:\\Configured LibreOffice\\program\\soffice.exe' },
  });

  await plugin.onload();

  expect(detectOfficeRuntime).toHaveBeenCalledWith(
    expect.objectContaining({
      configuredPath: 'C:\\Configured LibreOffice\\program\\soffice.exe',
      operatingSystem: 'windows',
      platform: 'desktop',
    })
  );
});

test('passes detected LibreOffice setup state into created editor views', async () => {
  const { default: LibreNoteEditorPlugin } = await import('./main');
  const workspace = createWorkspaceMock();
  const vault = createVaultMock();

  const plugin = new LibreNoteEditorPlugin(...createPluginMockArguments(vault, workspace));
  const registerView = jest.mocked(plugin.registerView);

  await plugin.onload();

  const createView = registerView.mock.calls[0]?.[1] as (leaf: WorkspaceLeaf) => unknown;
  const editorView = createView(createLeaf(createMarkdownFile('Runtime.md'))) as {
    officeRuntimeSetupState: unknown;
  };

  expect(editorView.officeRuntimeSetupState).toBe(mockOfficeRuntimeSetupState);
});
