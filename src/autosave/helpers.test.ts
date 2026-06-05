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

test('exports Obsidian links, embeds, tags, and block ids as Obsidian markdown', () => {
  const htmlSource = [
    '<article>',
    '<p>',
    '<a data-libre-obsidian-link-source="[[Note]]">Note</a> ',
    '<a data-libre-obsidian-link-source="[[Note#Heading]]">Renamed Heading</a> ',
    '<a data-libre-obsidian-link-source="[[Note|Alias]]">Alias</a> ',
    '<a data-libre-obsidian-link-source="[[Note#Heading|Alias]]">Alias</a> ',
    '<a data-libre-obsidian-link-source="[[Note#^block-id]]">block-id</a> ',
    '<a class="tag" href="#parent/child">#parent/child</a>',
    '</p>',
    '<span class="internal-embed" data-libre-obsidian-link-source="![[File.png]]"></span>',
    '<span class="internal-embed" data-libre-obsidian-link-source="![[Note]]"></span>',
    '<span data-libre-obsidian-block-id-source="^block-id">^block-id</span>',
    '</article>',
  ].join('');

  expect(convertHtmlToMarkdownMirror(htmlSource)).toBe(
    [
      '[[Note]] [[Note#Heading|Renamed Heading]] [[Note|Alias]] [[Note#Heading|Alias]] [[Note#^block-id]] #parent/child',
      '',
      '![[File.png]]',
      '',
      '![[Note]]',
      '',
      '^block-id',
    ].join('\n')
  );
});

test('exports rendered Obsidian anchors as wiki links and tags', () => {
  const htmlSource =
    '<article><p><a class="internal-link" data-href="Missing Note">Missing Note</a> <a class="tag" href="#tag">#tag</a></p></article>';

  expect(convertHtmlToMarkdownMirror(htmlSource)).toBe('[[Missing Note]] #tag');
});

test('exports edited fallback link token text as an alias', () => {
  const htmlSource =
    '<article><span data-libre-obsidian-link-source="[[Note#Heading]]">Edited Alias</span></article>';

  expect(convertHtmlToMarkdownMirror(htmlSource)).toBe('[[Note#Heading|Edited Alias]]');
});

test('exports untouched fallback link tokens as exact source markdown', () => {
  const htmlSource =
    '<article><span data-libre-obsidian-link-source="![[File.png]]">![[File.png]]</span></article>';

  expect(convertHtmlToMarkdownMirror(htmlSource)).toBe('![[File.png]]');
});

test('does not emit empty markdown headings', () => {
  expect(convertHtmlToMarkdownMirror('<article><h2></h2><p>Body</p></article>')).toBe('Body');
});
