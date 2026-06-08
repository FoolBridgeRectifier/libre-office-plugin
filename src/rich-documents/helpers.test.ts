import { RICH_DOCUMENTS_ROOT_PATH } from './constants';
import {
  createRichDocumentFilePaths,
  createStableRichDocumentId,
  isPathInsideRichDocumentsRoot,
} from '.';

test('generates stable rich document ids with unique random segments', () => {
  const firstId = createStableRichDocumentId('2026-05-31T12:00:00.000Z', 0.1);
  const secondId = createStableRichDocumentId('2026-05-31T12:00:00.000Z', 0.2);

  expect(firstId).toBe('rich-20260531120000-8va10rq7g3');
  expect(secondId).toBe('rich-20260531120000-hqk21jgew6');
  expect(firstId).not.toBe(secondId);
});

test('creates rich document paths inside the documents root', () => {
  const paths = createRichDocumentFilePaths('../Unsafe Note.md');

  expect(paths.folderPath).toBe(`${RICH_DOCUMENTS_ROOT_PATH}/---Unsafe-Note-md`);
  expect(paths.htmlPath).toBe(`${RICH_DOCUMENTS_ROOT_PATH}/---Unsafe-Note-md/document.html`);
  expect(paths.odtPath).toBe(`${RICH_DOCUMENTS_ROOT_PATH}/---Unsafe-Note-md/document.odt`);

  expect(isPathInsideRichDocumentsRoot(paths.htmlPath)).toBe(true);
  expect(isPathInsideRichDocumentsRoot('../outside/document.html')).toBe(false);
});
