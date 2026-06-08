import { syncDesktopOdtSave } from './conversion';
import {
  createConversionTestMapping,
  createConversionTestProcess,
  createConversionTestStore,
  createConversionTestVaultAdapter,
} from './test-runtime/testRuntime';

test.each([
  ['plain text', 'not a zip package'],
  ['zip package without ODT MIME marker', 'PK-random-zip-package'],
])('%s masquerading as ODT fails before conversion writes sources', async (_label, odtSource) => {
  const files: Record<string, string> = {};
  const vaultAdapter = createConversionTestVaultAdapter(files);
  const mapping = await createConversionTestMapping(vaultAdapter, files);

  const process = createConversionTestProcess(() => {
    files[mapping.htmlPath] = '<article><p>Bad overwrite</p></article>';
  });

  files[mapping.odtPath] = odtSource;

  await expect(
    syncDesktopOdtSave({
      mapping,
      richDocumentStore: createConversionTestStore(),
      runtime: { executablePath: 'soffice', process },
      vaultAdapter,
    })
  ).rejects.toThrow('conversion failed');

  expect(process.executeFile).not.toHaveBeenCalled();
  expect(files[mapping.htmlPath]).toBe('<article><p>Previous</p></article>');
  expect(files[mapping.markdownPath]).toBe('# Previous');
});
