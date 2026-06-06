import { TABLE_SCROLL_CONTAINER_CLASS } from '../attachments/constants';
import { EDITOR_CONTAINED_MEDIA_CLASS_NAME } from './constants';
import { isInsideProtectedContent, prepareHtmlForEditor, readHtmlFromEditor } from './helpers';

test('marks protected raw blocks read-only in the editor', () => {
  const htmlSource = '<pre data-libre-protected="raw-markdown"># Raw</pre>';
  const preparedHtmlSource = prepareHtmlForEditor(htmlSource);

  expect(preparedHtmlSource).toContain('contenteditable="false"');
  expect(preparedHtmlSource).toContain('data-libre-editor-protected="true"');
  expect(preparedHtmlSource).toContain('libre-protected-html-block');
});

test('removes editor-only protected markers when reading html source', () => {
  const editorElement = document.createElement('div');

  editorElement.innerHTML =
    '<pre data-libre-protected="raw-markdown" data-libre-editor-protected="true" contenteditable="false" class="libre-protected-html-block"># Raw</pre>';

  expect(readHtmlFromEditor(editorElement)).toBe(
    '<pre data-libre-protected="raw-markdown"># Raw</pre>'
  );
});

test('keeps editor-only image containment classes out of saved html', () => {
  const editorElement = document.createElement('div');

  editorElement.innerHTML = `<img alt="Wide" class="${EDITOR_CONTAINED_MEDIA_CLASS_NAME}" src="wide.png">`;

  expect(readHtmlFromEditor(editorElement)).toBe('<img alt="Wide" src="wide.png">');
});

test('keeps existing protected classes when reading html source', () => {
  const editorElement = document.createElement('div');

  editorElement.innerHTML =
    '<pre data-libre-protected="raw-markdown" data-libre-editor-protected="true" contenteditable="false" class="language-md libre-protected-html-block"># Raw</pre>';

  expect(readHtmlFromEditor(editorElement)).toBe(
    '<pre data-libre-protected="raw-markdown" class="language-md"># Raw</pre>'
  );
});

test('prepares images and tables for container-safe mobile editing', () => {
  const preparedHtmlSource = prepareHtmlForEditor(
    '<article><img alt="Wide" src="wide.png"><table><tr><td>Wide</td></tr></table></article>'
  );

  expect(preparedHtmlSource).toContain(`class="${EDITOR_CONTAINED_MEDIA_CLASS_NAME}"`);
  expect(preparedHtmlSource).toContain(`class="${TABLE_SCROLL_CONTAINER_CLASS}"`);
});

test('does not duplicate existing table overflow wrappers', () => {
  const preparedHtmlSource = prepareHtmlForEditor(
    `<div class="${TABLE_SCROLL_CONTAINER_CLASS}"><table><tr><td>Wide</td></tr></table></div>`
  );

  const htmlDocument = new DOMParser().parseFromString(preparedHtmlSource, 'text/html');

  expect(htmlDocument.querySelectorAll('.libre-table-scroll')).toHaveLength(1);
});

test('does not keep remote loading elements or remote asset sources', () => {
  const preparedHtmlSource = prepareHtmlForEditor(
    [
      '<script src="https://cdn.example/editor.js"></script>',
      '<link rel="stylesheet" href="https://cdn.example/editor.css">',
      '<iframe src="https://example.com"></iframe>',
      '<img src="https://example.com/image.png" srcset="//example.com/image-2x.png 2x" alt="remote">',
      '<img src="app://local/image.png" alt="local">',
    ].join('')
  );

  expect(preparedHtmlSource).not.toContain('<script');
  expect(preparedHtmlSource).not.toContain('<link');
  expect(preparedHtmlSource).not.toContain('<iframe');

  const htmlDocument = new DOMParser().parseFromString(preparedHtmlSource, 'text/html');
  const remoteImageElement = htmlDocument.querySelector('img[alt="remote"]');
  const localImageElement = htmlDocument.querySelector('img[alt="local"]');

  expect(remoteImageElement?.getAttribute('src')).toBe(null);
  expect(remoteImageElement?.getAttribute('srcset')).toBe(null);
  expect(localImageElement?.getAttribute('src')).toBe('app://local/image.png');
});

test('detects whether an event target is inside protected content', () => {
  const wrapperElement = document.createElement('div');

  wrapperElement.innerHTML =
    '<pre data-libre-protected="raw-markdown"><code><span># Raw</span></code></pre>';

  expect(isInsideProtectedContent(wrapperElement.querySelector('span'))).toBe(true);
  expect(isInsideProtectedContent(wrapperElement)).toBe(false);
  expect(isInsideProtectedContent(null)).toBe(false);
});
