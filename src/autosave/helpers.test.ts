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
  const markdownSource = '---\ntitle: Alpha\ntags: [demo]\n---\n\nOld body';
  const htmlSource = '<article><p>New body</p></article>';

  expect(createMarkdownMirrorSource(markdownSource, htmlSource)).toBe(
    '---\ntitle: Alpha\ntags: [demo]\n---\n\nNew body'
  );
});

test('preserves protected raw markdown blocks as markdown source', () => {
  const htmlSource = [
    '<article><p>Before edit</p>',
    '<pre data-libre-protected="raw-markdown">[[Wiki]]\n#tag</pre>',
    '<p>After edit</p></article>',
  ].join('');

  expect(convertHtmlToMarkdownMirror(htmlSource)).toBe(
    'Before edit\n\n[[Wiki]]\n#tag\n\nAfter edit'
  );
});

test('exports exact structured markdown sources from annotated html', () => {
  const htmlSource = [
    '<article>',
    '<div class="callout" data-libre-structured-markdown-source="&gt; [!todo]- Custom&#10;&gt; Body" data-libre-structured-markdown-type="callout"></div>',
    '<div class="callout" data-libre-structured-markdown-source="&gt; [!custom]+ Unknown&#10;&gt; Nested" data-libre-structured-markdown-type="callout"></div>',
    '<pre data-libre-protected="code-fence" data-libre-structured-markdown-source="~~~js&#10;const value = `tick`;&#10;~~~" data-libre-structured-markdown-type="code-fence"><code>ignored</code></pre>',
    '<p>Inline <code data-libre-structured-markdown-source="``code ` value``" data-libre-structured-markdown-type="inline-code">code ` value</code></p>',
    '</article>',
  ].join('');

  expect(convertHtmlToMarkdownMirror(htmlSource)).toBe(
    [
      '> [!todo]- Custom',
      '> Body',
      '',
      '> [!custom]+ Unknown',
      '> Nested',
      '',
      '~~~js',
      'const value = `tick`;',
      '~~~',
      '',
      'Inline ``code ` value``',
    ].join('\n')
  );
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

test('exports annotated image attachments as Obsidian embeds', () => {
  const htmlSource = [
    '<article>',
    '<span data-libre-attachment-source="![[image.png]]" data-libre-attachment-path="image.png">',
    '<img alt="" src="app://vault/image.png">',
    '</span>',
    '</article>',
  ].join('');

  expect(convertHtmlToMarkdownMirror(htmlSource)).toBe('![[image.png]]');
});

test('exports renamed image attachment paths from rendered metadata', () => {
  const htmlSource = [
    '<article>',
    '<span data-libre-attachment-source="![[Old image.png]]" data-href="Attachments/Renamed image.png">',
    '<img alt="Preview caption" src="app://vault/Renamed%20image.png">',
    '</span>',
    '</article>',
  ].join('');

  expect(convertHtmlToMarkdownMirror(htmlSource)).toBe(
    '![[Attachments/Renamed image.png|Preview caption]]'
  );
});

test('exports simple html tables as markdown tables', () => {
  const htmlSource = [
    '<article>',
    '<table>',
    '<thead><tr><th>Name</th><th align="center">Value</th></tr></thead>',
    '<tbody><tr><td>Alpha</td><td>A|B</td></tr></tbody>',
    '</table>',
    '</article>',
  ].join('');

  expect(convertHtmlToMarkdownMirror(htmlSource)).toBe(
    ['| Name | Value |', '| --- | :---: |', '| Alpha | A\\|B |'].join('\n')
  );
});

test('exports complex html tables as sanitized html fallback', () => {
  const htmlSource = [
    '<article>',
    '<table data-libre-table-html-source="<table><tr><td rowspan=&quot;2&quot;>Merged</td></tr></table>">',
    '<tr><td rowspan="2">Merged</td></tr>',
    '</table>',
    '</article>',
  ].join('');

  expect(convertHtmlToMarkdownMirror(htmlSource)).toBe(
    '<table><tr><td rowspan="2">Merged</td></tr></table>'
  );
});

test('does not emit empty markdown headings', () => {
  expect(convertHtmlToMarkdownMirror('<article><h2></h2><p>Body</p></article>')).toBe('Body');
});
