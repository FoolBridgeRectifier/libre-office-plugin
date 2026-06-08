import { createEditor } from 'lexical';

import { convertHtmlToMarkdownMirror } from '../../../autosave';
import { convertMarkdownToHtmlWithObsidianRenderer } from '../../../markdown-sync';
import { HtmlElementNode, LockedHtmlNode } from '../html-element/htmlElement';
import { loadHtmlSourceIntoLexicalEditor } from './helpers';

type StressMarkdownRenderer = (
  bodyMarkdown: string,
  containerElement: HTMLElement,
  sourcePath: string
) => Promise<void>;

function loadHtmlThroughLexical(htmlSource: string): string {
  const editor = createEditor({
    namespace: 'LibreRoundTripStressTest',
    nodes: [HtmlElementNode, LockedHtmlNode],
    onError: (error) => {
      throw error;
    },
  });

  let exportedHtmlSource = '';

  editor.update(
    () => {
      exportedHtmlSource = loadHtmlSourceIntoLexicalEditor(editor, htmlSource);
    },
    { discrete: true }
  );

  return exportedHtmlSource;
}

function editRoundTripHtml(htmlSource: string): string {
  const htmlDocument = new DOMParser().parseFromString(htmlSource, 'text/html');

  const codeElement = htmlDocument.querySelector('[data-libre-protected="code-fence"] code');
  const localImageElement = htmlDocument.querySelector('img[alt="Local caption"]');

  const simpleTableCellElement = htmlDocument.querySelector(
    'table[data-libre-table-kind="simple"] td'
  );

  const complexTableCellElement = htmlDocument.querySelector(
    'table[data-libre-protected="complex-table"] td'
  );

  codeElement?.replaceChildren('const edited = true;');
  localImageElement?.setAttribute('alt', 'Edited caption');
  simpleTableCellElement?.replaceChildren('Beta');
  complexTableCellElement?.replaceChildren('Edited merged');

  htmlDocument.querySelector('[data-libre-protected="desktop-only"]')?.remove();

  return htmlDocument.body.innerHTML;
}

const stressMarkdownSource = [
  '~~~js',
  'const value = `tick`;',
  '~~~',
  '',
  '![[Local.png|Local caption]]',
  '',
  '![Remote diagram](https://example.com/remote.png)',
  '',
  '| Name | Value |',
  '| --- | --- |',
  '| Alpha | One |',
  '',
  '<table><tr><td rowspan="2">Merged</td></tr></table>',
].join('\n');

const expectedUneditedMarkdownMirror = [
  '~~~js',
  'const value = `tick`;',
  '~~~',
  '',
  '![[Local.png|Local caption]]',
  '',
  '![Remote diagram](https://example.com/remote.png)',
  '',
  '| Name | Value |',
  '| --- | --- |',
  '| Alpha | One |',
  '',
  '<table><tbody><tr><td rowspan="2">Merged</td></tr></tbody></table>',
].join('\n');

const stressRenderer: jest.MockedFunction<StressMarkdownRenderer> = jest.fn(
  async (bodyMarkdown, containerElement, _sourcePath) => {
    expect(bodyMarkdown).not.toContain('https://example.com/remote.png');

    containerElement.innerHTML = [
      '<pre><code class="language-js">const value = `tick`;</code></pre>',
      '<span class="internal-embed image-embed"><img alt="Local caption" src="app://vault/Local.png"></span>',
      '<img alt="Remote diagram" src="app://vault/libre-note-editor-remote-image-0.png">',
      '<table><thead><tr><th>Name</th><th>Value</th></tr></thead><tbody><tr><td>Alpha</td><td>One</td></tr></tbody></table>',
      '<table><tr><td rowspan="2">Merged</td></tr></table>',
    ].join('');
  }
);

test('round trips tables embeds and code through import lexical and markdown export', async () => {
  const importResult = await convertMarkdownToHtmlWithObsidianRenderer(stressMarkdownSource, {
    markdownRenderer: stressRenderer,
    sourcePath: 'Stress.md',
  });

  const lexicalHtmlSource = loadHtmlThroughLexical(importResult.htmlSource);

  expect(lexicalHtmlSource).toContain('data-libre-protected="code-fence"');
  expect(lexicalHtmlSource).toContain('data-libre-protected="complex-table"');

  expect(lexicalHtmlSource).toContain(
    'data-libre-attachment-source="![[Local.png|Local caption]]"'
  );

  expect(lexicalHtmlSource).toContain(
    'data-libre-attachment-source="![Remote diagram](https://example.com/remote.png)"'
  );

  expect(convertHtmlToMarkdownMirror(lexicalHtmlSource)).toBe(expectedUneditedMarkdownMirror);
});

test('exports edited tables embeds and code after lexical round trip', async () => {
  const importResult = await convertMarkdownToHtmlWithObsidianRenderer(stressMarkdownSource, {
    markdownRenderer: stressRenderer,
    sourcePath: 'Stress.md',
  });

  const editedHtmlSource = editRoundTripHtml(loadHtmlThroughLexical(importResult.htmlSource));
  const lexicalEditedHtmlSource = loadHtmlThroughLexical(editedHtmlSource);

  expect(convertHtmlToMarkdownMirror(lexicalEditedHtmlSource)).toBe(
    [
      '```js',
      'const edited = true;',
      '```',
      '',
      '![[Local.png|Edited caption]]',
      '',
      '| Name | Value |',
      '| --- | --- |',
      '| Beta | One |',
      '',
      '<table><tbody><tr><td rowspan="2">Edited merged</td></tr></tbody></table>',
    ].join('\n')
  );
});
