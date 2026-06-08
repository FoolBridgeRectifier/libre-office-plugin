import {
  ensureDesktopOdtSource,
  sanitizeConvertedHtmlSource,
  syncDesktopOdtSave,
} from './conversion';
import {
  createConversionTestMapping,
  createConversionTestOdtSource,
  createConversionTestProcess,
  createConversionTestStore,
  createConversionTestVaultAdapter,
} from './test-runtime/testRuntime';

test('rejects conversion paths outside the rich document root', async () => {
  const files: Record<string, string> = {};
  const vaultAdapter = createConversionTestVaultAdapter(files);

  const mapping = {
    ...(await createConversionTestMapping(vaultAdapter, files)),
    htmlPath: 'outside/document.html',
    odtPath: 'outside/document.odt',
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

test('returns null when the ODT source has not changed', async () => {
  const files: Record<string, string> = {};
  const vaultAdapter = createConversionTestVaultAdapter(files);
  const mapping = await createConversionTestMapping(vaultAdapter, files);
  const process = createConversionTestProcess();

  await expect(
    syncDesktopOdtSave({
      mapping,
      richDocumentStore: createConversionTestStore(),
      runtime: { executablePath: 'soffice', process },
      vaultAdapter,
    })
  ).resolves.toBe(null);

  expect(process.executeFile).not.toHaveBeenCalled();
});

test.each([
  ['locked ODT', { exitCode: 1, standardError: 'file is locked' }],
  ['corrupt ODT', { exitCode: 1, standardError: 'format error' }],
  ['conversion timeout', { exitCode: null, timedOut: true }],
])('%s conversion failure preserves valid sources', async (_label, result) => {
  const files: Record<string, string> = {};
  const vaultAdapter = createConversionTestVaultAdapter(files);
  const mapping = await createConversionTestMapping(vaultAdapter, files);

  files[mapping.odtPath] = createConversionTestOdtSource('after');

  await expect(
    syncDesktopOdtSave({
      mapping,
      richDocumentStore: createConversionTestStore(),
      runtime: {
        executablePath: 'soffice',
        process: createConversionTestProcess(undefined, result),
      },
      vaultAdapter,
    })
  ).rejects.toThrow('conversion failed');

  expect(files[mapping.htmlPath]).toBe('<article><p>Previous</p></article>');
  expect(files[mapping.markdownPath]).toBe('# Previous');
});

test('conversion failure leaves previous valid sources intact', async () => {
  const files: Record<string, string> = {};
  const vaultAdapter = createConversionTestVaultAdapter(files);
  const mapping = await createConversionTestMapping(vaultAdapter, files);

  const failingProcess = createConversionTestProcess(undefined, { exitCode: 1 });

  files[mapping.odtPath] = createConversionTestOdtSource('after');

  await expect(
    syncDesktopOdtSave({
      mapping,
      richDocumentStore: createConversionTestStore(),
      runtime: { executablePath: 'soffice', process: failingProcess },
      vaultAdapter,
    })
  ).rejects.toThrow('conversion failed');

  expect(files[mapping.htmlPath]).toBe('<article><p>Previous</p></article>');
  expect(files[mapping.markdownPath]).toBe('# Previous');
});

test('marks page layout, comments, and tracked changes as desktop-only', () => {
  const sanitizedHtml = sanitizeConvertedHtmlSource(
    '<article><header>H</header><footer>F</footer><p style="page-break-before: always">P</p><span class="comment">C</span><span class="tracked-change">T</span></article>'
  );
  const htmlDocument = new DOMParser().parseFromString(sanitizedHtml, 'text/html');

  const protectedElements = htmlDocument.querySelectorAll(
    '[data-libre-protected="desktop-only"][contenteditable="false"]'
  );

  expect(protectedElements.length).toBe(5);
});

test('protects remote converted images without fetching them', () => {
  const sanitizedHtml = sanitizeConvertedHtmlSource(
    '<article><img src="https://example.com/image.png"><img src="local.png"></article>'
  );

  const htmlDocument = new DOMParser().parseFromString(sanitizedHtml, 'text/html');
  const remoteImageElement = htmlDocument.querySelector('[data-libre-remote-image-src]');

  expect(sanitizedHtml).toContain('data-libre-remote-image-src="https://example.com/image.png"');
  expect(sanitizedHtml).toContain('src="local.png"');
  expect(remoteImageElement?.getAttribute('src')).toBe(null);
});

test('removes executable converted styles and remote image source sets', () => {
  const sanitizedHtml = sanitizeConvertedHtmlSource(
    [
      '<article>',
      '<style>@import "https://example.com/bad.css";</style>',
      '<link rel="stylesheet" href="https://example.com/bad.css">',
      '<p style="background-image: url(javascript:bad())">Styled</p>',
      '<img srcset="https://example.com/a.png 1x, local.png 2x" src="local.png">',
      '</article>',
    ].join('')
  );

  expect(sanitizedHtml).not.toContain('<style');
  expect(sanitizedHtml).not.toContain('<link');
  expect(sanitizedHtml).not.toContain('javascript:');
  expect(sanitizedHtml).not.toContain('srcset');
});
