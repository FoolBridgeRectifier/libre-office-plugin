import {
  createConversionCommand,
  detectOdtSaveEvent,
  ensureDesktopOdtSource,
  openDesktopOdtSource,
  sanitizeConvertedHtmlSource,
  syncDesktopOdtSave,
} from './conversion';
import {
  createConversionTestMapping,
  createConversionTestOdtSource,
  createConversionTestProcess,
  createConversionTestStore,
  createConversionTestVaultAdapter,
} from './helpers/test-runtime/testRuntime';

test('constructs LibreOffice conversion commands without shell strings', () => {
  const command = createConversionCommand('soffice', 'document.html', 'folder', 'odt');

  expect(command.executablePath).toBe('soffice');

  expect(command.argumentsList).toEqual([
    '-env:UserInstallation=file:///folder/.libreoffice-profile',
    '--headless',
    '--safe-mode',
    '--norestore',
    '--nolockcheck',
    '--nodefault',
    '--nofirststartwizard',
    '--convert-to',
    'odt',
    '--outdir',
    'folder',
    'document.html',
  ]);

  expect(
    createConversionCommand('soffice', 'document.html', 'C:\\Vault Path\\folder', 'odt')
      .argumentsList[0]
  ).toBe('-env:UserInstallation=file:///C:/Vault%20Path/folder/.libreoffice-profile');
});

test('rejects generated paths outside the rich document folder', async () => {
  const files: Record<string, string> = {};
  const vaultAdapter = createConversionTestVaultAdapter(files);

  const mapping = {
    ...(await createConversionTestMapping(vaultAdapter, files)),
    odtPath: '.libre-note-editor/documents/other/document.odt',
  };

  await expect(
    ensureDesktopOdtSource({
      mapping,
      richDocumentStore: createConversionTestStore(),
      runtime: { executablePath: 'soffice', process: createConversionTestProcess() },
      vaultAdapter,
    })
  ).rejects.toThrow('rich document folder');
});

test('detects ODT save events through source state checks', async () => {
  const files: Record<string, string> = {};
  const vaultAdapter = createConversionTestVaultAdapter(files);
  const mapping = await createConversionTestMapping(vaultAdapter, files);

  files[mapping.odtPath] = createConversionTestOdtSource('after');

  await expect(detectOdtSaveEvent({ mapping, vaultAdapter })).resolves.toEqual({
    hasSavedOdtChange: true,
  });
});

test('opens ODT source through the visible runtime launcher', async () => {
  const files: Record<string, string> = {};
  const vaultAdapter = createConversionTestVaultAdapter(files);
  const mapping = await createConversionTestMapping(vaultAdapter, files);

  const process = {
    executeFile: jest.fn(),
    launchFile: jest.fn(async () => undefined),
  };

  await openDesktopOdtSource({
    mapping,
    richDocumentStore: createConversionTestStore(),
    runtime: { executablePath: 'soffice', process },
    vaultAdapter,
  });

  expect(process.launchFile).toHaveBeenCalledWith('soffice', [mapping.odtPath], 1000);

  expect(process.executeFile).not.toHaveBeenCalled();
});

test('syncs ODT saves through HTML sanitizing and markdown mirror writes', async () => {
  const files: Record<string, string> = {};
  const vaultAdapter = createConversionTestVaultAdapter(files);
  const mapping = await createConversionTestMapping(vaultAdapter, files);

  const process = createConversionTestProcess(() => {
    files[mapping.htmlPath] =
      '<article><header>Header</header><p>Body</p><script>bad()</script></article>';
  });

  files[mapping.odtPath] = createConversionTestOdtSource('after');

  const htmlSource = await syncDesktopOdtSave({
    mapping,
    richDocumentStore: createConversionTestStore(),
    runtime: { executablePath: 'soffice', process },
    vaultAdapter,
  });

  expect(process.executeFile).toHaveBeenCalledWith(
    'soffice',
    expect.arrayContaining(['--convert-to', 'html', mapping.odtPath]),
    30000
  );

  expect(htmlSource).toContain('data-libre-protected="desktop-only"');
  expect(files[mapping.htmlPath]).toContain('<header');
  expect(files[mapping.htmlPath]).not.toContain('<script>');
  expect(files[mapping.markdownPath]).toBe('Body');
});

test('protects desktop-only content and strips executable HTML', () => {
  const sanitizedHtml = sanitizeConvertedHtmlSource(
    '<article><footer onclick="bad()">Footer</footer><a href="javascript:bad()">Link</a><script>bad()</script></article>'
  );

  expect(sanitizedHtml).toContain('data-libre-desktop-only="true"');
  expect(sanitizedHtml).not.toContain('onclick');
  expect(sanitizedHtml).not.toContain('javascript:');
  expect(sanitizedHtml).not.toContain('<script>');
});
