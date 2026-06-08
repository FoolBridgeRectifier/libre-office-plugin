import { convertMarkdownToHtmlWithObsidianRenderer } from '../..';
import type { MarkdownBodyRenderer } from '../../interfaces';

test('annotates structured markdown blocks with exact source markdown', async () => {
  const markdownRenderer: jest.MockedFunction<MarkdownBodyRenderer> = jest.fn(
    async (_bodyMarkdown, containerElement, _sourcePath) => {
      containerElement.innerHTML = [
        '<div class="callout" data-callout="tip" data-callout-fold="+"><div class="callout-content"><p>Body</p></div></div>',
        '<div class="callout" data-callout="info"><div class="callout-content"><div class="callout" data-callout="warning"></div></div></div>',
        '<pre><code class="language-ts">const value = true;</code></pre>',
        '<p><code>inline code</code></p>',
      ].join('');
    }
  );

  const result = await convertMarkdownToHtmlWithObsidianRenderer(
    [
      '> [!tip]+ Useful',
      '> Body',
      '',
      '> [!info] Parent',
      '> > [!warning] Nested',
      '',
      '```ts',
      'const value = true;',
      '```',
      '',
      '`inline code`',
    ].join('\n'),
    { markdownRenderer, sourcePath: 'Structured.md' }
  );

  expect(result.htmlSource).toContain('data-libre-structured-markdown-type="callout"');
  expect(result.htmlSource).toContain('data-libre-structured-markdown-type="code-fence"');
  expect(result.htmlSource).toContain('data-libre-protected="code-fence"');

  expect(result.htmlSource).toContain('data-libre-structured-markdown-type="inline-code"');
  expect(result.htmlSource).not.toContain('data-callout="warning" data-libre-structured');
});

test('keeps unsupported comment markdown in protected raw blocks', async () => {
  const markdownRenderer: jest.MockedFunction<MarkdownBodyRenderer> = jest.fn(
    async (_bodyMarkdown, containerElement, _sourcePath) => {
      containerElement.innerHTML = '<p>Visible body</p>';
    }
  );

  const result = await convertMarkdownToHtmlWithObsidianRenderer('%%secret%%\n\nVisible body', {
    markdownRenderer,
    sourcePath: 'Comment.md',
  });

  expect(result.htmlSource).toContain('data-libre-protected="raw-markdown"');
  expect(result.htmlSource).toContain('data-libre-structured-markdown-source="%%secret%%"');
});

test('annotates rendered image attachments and tables', async () => {
  const markdownRenderer: jest.MockedFunction<MarkdownBodyRenderer> = jest.fn(
    async (_bodyMarkdown, containerElement, _sourcePath) => {
      containerElement.innerHTML = [
        '<span class="internal-embed image-embed"><img src="app://vault/image.png"></span>',
        '<table><tr><th>Name</th></tr><tr><td>Alpha</td></tr></table>',
        '<table><tr><td colspan="2">Merged</td></tr></table>',
      ].join('');
    }
  );

  const result = await convertMarkdownToHtmlWithObsidianRenderer(
    ['![[image.png]]', '', '| Name |', '| --- |', '| Alpha |'].join('\n'),
    { markdownRenderer, sourcePath: 'Attachments.md' }
  );

  expect(result.htmlSource).toContain('data-libre-attachment-source="![[image.png]]"');
  expect(result.htmlSource).toContain('data-libre-attachment-path="image.png"');
  expect(result.htmlSource).toContain('libre-table-scroll overflow-x-auto max-w-full');

  expect(result.htmlSource).toContain('data-libre-table-kind="simple"');
  expect(result.htmlSource).toContain('data-libre-table-kind="complex"');
  expect(result.htmlSource).toContain('data-libre-protected="complex-table"');
});
