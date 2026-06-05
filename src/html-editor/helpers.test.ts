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

test('keeps existing protected classes when reading html source', () => {
  const editorElement = document.createElement('div');

  editorElement.innerHTML =
    '<pre data-libre-protected="raw-markdown" data-libre-editor-protected="true" contenteditable="false" class="language-md libre-protected-html-block"># Raw</pre>';

  expect(readHtmlFromEditor(editorElement)).toBe(
    '<pre data-libre-protected="raw-markdown" class="language-md"># Raw</pre>'
  );
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

  expect(preparedHtmlSource).toContain('<img alt="remote">');
  expect(preparedHtmlSource).toContain('<img src="app://local/image.png" alt="local">');
});

test('detects whether an event target is inside protected content', () => {
  const wrapperElement = document.createElement('div');

  wrapperElement.innerHTML =
    '<pre data-libre-protected="raw-markdown"><code><span># Raw</span></code></pre>';

  expect(isInsideProtectedContent(wrapperElement.querySelector('span'))).toBe(true);
  expect(isInsideProtectedContent(wrapperElement)).toBe(false);
  expect(isInsideProtectedContent(null)).toBe(false);
});
