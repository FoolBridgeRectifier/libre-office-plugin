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

  expect(command.argumentsList).toContain('--safe-mode');
  expect(command.argumentsList.some((argument) => /macro/i.test(argument))).toBe(false);
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

test('creates ODT from a complete LibreOffice HTML conversion document', async () => {
  const files: Record<string, string> = {};
  const vaultAdapter = createConversionTestVaultAdapter(files);
  const mapping = await createConversionTestMapping(vaultAdapter, files);

  const conversionHtmlPath = '.libre-note-editor/documents/rich-note/document-conversion.html';
  const conversionOutputPath = '.libre-note-editor/documents/rich-note/document-conversion.odt';

  Reflect.deleteProperty(files, mapping.odtPath);

  const process = createConversionTestProcess(() => {
    files[conversionOutputPath] = createConversionTestOdtSource('created');
  });

  await ensureDesktopOdtSource({
    mapping,
    richDocumentStore: createConversionTestStore(),
    runtime: { executablePath: 'soffice', process },
    vaultAdapter,
  });

  expect(files[conversionHtmlPath]).toContain('<!doctype html>');
  expect(files[conversionHtmlPath]).toContain('<body><article><p>Previous</p></article></body>');

  expect(files[mapping.odtPath]).toBe(createConversionTestOdtSource('created'));
  expect(files[conversionOutputPath]).toBe(undefined);
});

test('rejects ODT conversion when LibreOffice does not create the output file', async () => {
  const files: Record<string, string> = {};
  const vaultAdapter = createConversionTestVaultAdapter(files);
  const mapping = await createConversionTestMapping(vaultAdapter, files);

  Reflect.deleteProperty(files, mapping.odtPath);

  await expect(
    ensureDesktopOdtSource({
      mapping,
      richDocumentStore: createConversionTestStore(),
      runtime: { executablePath: 'soffice', process: createConversionTestProcess() },
      vaultAdapter,
    })
  ).rejects.toThrow('conversion failed');

  expect(files[mapping.odtPath]).toBe(undefined);
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

test('neutralizes dangerous converted URLs and style asset loads', () => {
  const sanitizedHtml = sanitizeConvertedHtmlSource(
    [
      '<article>',
      '<a href="vbscript:bad()">VB</a>',
      '<img src="data:text/html,bad">',
      '<p style="background-image: url(https://example.com/track.png)">Styled</p>',
      '</article>',
    ].join('')
  );

  expect(sanitizedHtml).not.toContain('vbscript:');
  expect(sanitizedHtml).not.toContain('data:text/html');
  expect(sanitizedHtml).not.toContain('background-image');
});
