import { convertHtmlToMarkdownMirror, createMarkdownMirrorSource } from './helpers';

test('exports supported html blocks to exact markdown', () => {
  const htmlSource = [
    '<article>',
    '<h2>Heading</h2>',
    '<p>Text <strong>bold</strong> <em>em</em> <code>code</code></p>',
    '<ul><li>First</li><li data-task="x">Done</li></ul>',
    '<pre><code class="language-ts">const value = true;</code></pre>',
    '</article>',
  ].join('');

  expect(convertHtmlToMarkdownMirror(htmlSource)).toBe(
    [
      '## Heading',
      '',
      'Text **bold** *em* `code`',
      '',
      '- First',
      '- [x] Done',
      '',
      '```ts',
      'const value = true;',
      '```',
    ].join('\n')
  );
});

test('preserves frontmatter above generated markdown body', () => {
  const markdownSource = '---\ntags: [demo]\n---\n\nOld body';
  const htmlSource = '<article><p>New body</p></article>';

  expect(createMarkdownMirrorSource(markdownSource, htmlSource)).toBe(
    '---\ntags: [demo]\n---\n\nNew body'
  );
});

test('preserves protected raw markdown blocks as markdown source', () => {
  const htmlSource =
    '<article><pre data-libre-protected="raw-markdown">[[Wiki]]\n#tag</pre></article>';

  expect(convertHtmlToMarkdownMirror(htmlSource)).toBe('[[Wiki]]\n#tag');
});
