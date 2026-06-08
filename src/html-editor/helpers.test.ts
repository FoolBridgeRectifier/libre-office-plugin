import { TABLE_SCROLL_CONTAINER_CLASS } from '../attachments/constants';
import { EDITOR_CONTAINED_MEDIA_CLASS_NAME, TASK_CHECKBOX_COLOR_PROPERTY } from './constants';
import {
  getHtmlSecurityWarningText,
  isInsideProtectedContent,
  prepareHtmlForEditor,
  readHtmlFromEditor,
} from './lexical-source/source-html';

test('marks protected raw blocks read-only in the editor', () => {
  const htmlSource = '<pre data-libre-protected="raw-markdown"># Raw</pre>';
  const preparedHtmlSource = prepareHtmlForEditor(htmlSource);

  expect(preparedHtmlSource).toContain('contenteditable="false"');
  expect(preparedHtmlSource).toContain('data-libre-editor-protected="true"');
  expect(preparedHtmlSource).toContain('libre-protected-html-block');
});

test('keeps protected code fences and complex tables editable in the editor', () => {
  const preparedHtmlSource = prepareHtmlForEditor(
    [
      '<pre data-libre-protected="code-fence"><code>const value = true;</code></pre>',
      '<table data-libre-protected="complex-table"><tr><td>Merged</td></tr></table>',
    ].join('')
  );

  const htmlDocument = new DOMParser().parseFromString(preparedHtmlSource, 'text/html');
  const codeFenceElement = htmlDocument.querySelector('[data-libre-protected="code-fence"]');
  const tableElement = htmlDocument.querySelector('[data-libre-protected="complex-table"]');

  expect(codeFenceElement?.getAttribute('contenteditable')).toBe(null);
  expect(codeFenceElement?.getAttribute('data-libre-editor-protected')).toBe(null);
  expect(tableElement?.getAttribute('contenteditable')).toBe(null);
  expect(tableElement?.getAttribute('data-libre-editor-protected')).toBe(null);
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

test('keeps editor-only checkbox color hooks out of saved html', () => {
  const editorElement = document.createElement('div');

  editorElement.innerHTML = [
    '<ul><li class="task-list-item" data-task="x">',
    `<input checked class="task-list-item-checkbox" style="${TASK_CHECKBOX_COLOR_PROPERTY}: rgb(180, 40, 120);" type="checkbox">`,
    'Done</li></ul>',
  ].join('');

  expect(readHtmlFromEditor(editorElement)).not.toContain(TASK_CHECKBOX_COLOR_PROPERTY);
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

test('strips executable pasted html before it is emitted for saving', () => {
  const editorElement = document.createElement('div');

  editorElement.innerHTML = [
    '<p onclick="bad()">Body</p>',
    '<a href="vbscript:bad()">Link</a>',
    '<img src="data:text/html,bad" onerror="bad()">',
    '<script>bad()</script>',
  ].join('');

  const htmlSource = readHtmlFromEditor(editorElement);

  expect(htmlSource).toContain('<p>Body</p>');
  expect(htmlSource).not.toContain('onclick');
  expect(htmlSource).not.toContain('vbscript:');

  expect(htmlSource).not.toContain('data:text/html');
  expect(htmlSource).not.toContain('<script');
});

test('reports unsafe html cleanup for user-facing warning states', () => {
  expect(getHtmlSecurityWarningText('<p onclick="bad()">Body</p>')).toBe(
    'Unsafe HTML was removed before editing.'
  );

  expect(getHtmlSecurityWarningText('<p>Body</p>')).toBe(null);
});

test('detects whether an event target is inside protected content', () => {
  const wrapperElement = document.createElement('div');

  wrapperElement.innerHTML = [
    '<pre data-libre-protected="raw-markdown"><code><span># Raw</span></code></pre>',
    '<pre data-libre-protected="code-fence"><code><span>const value = true;</span></code></pre>',
    '<table data-libre-protected="complex-table"><tr><td>Cell</td></tr></table>',
  ].join('');

  expect(isInsideProtectedContent(wrapperElement.querySelector('span'))).toBe(true);

  expect(
    isInsideProtectedContent(
      wrapperElement.querySelector('[data-libre-protected="code-fence"] span')
    )
  ).toBe(false);

  expect(
    isInsideProtectedContent(wrapperElement.querySelector('[data-libre-protected="complex-table"]'))
  ).toBe(false);

  expect(isInsideProtectedContent(wrapperElement)).toBe(false);
  expect(isInsideProtectedContent(null)).toBe(false);
});
