import { getAttachmentMarkdown } from './utils';
import { annotateAttachmentHtml } from './images';

test('annotates image embeds with exact markdown source and vault path', () => {
  const htmlSource =
    '<span class="internal-embed image-embed"><img src="app://vault/image.png"></span>';

  const annotatedHtml = annotateAttachmentHtml(htmlSource, [
    { text: '![[Folder/image.png|Caption]]', type: 'embed' },
  ]);

  const element = new DOMParser().parseFromString(annotatedHtml, 'text/html').body
    .firstElementChild as HTMLElement;

  expect(element.getAttribute('data-libre-attachment-source')).toBe(
    '![[Folder/image.png|Caption]]'
  );
  expect(element.getAttribute('data-libre-attachment-path')).toBe('Folder/image.png');

  expect(element.getAttribute('data-libre-attachment-caption')).toBe('Caption');
  expect(element.getAttribute('data-libre-attachment-status')).toBe('available');
});

test('shows a broken state for missing image attachments', () => {
  const htmlSource =
    '<span class="internal-embed image-embed"><img alt="Missing image.png could not be found."></span>';

  const annotatedHtml = annotateAttachmentHtml(htmlSource, [
    { text: '![[Missing image.png]]', type: 'embed' },
  ]);

  expect(annotatedHtml).toContain('data-libre-attachment-status="broken"');
  expect(annotatedHtml).toContain('Missing attachment: Missing image.png');
});

test('exports broken image attachments as exact source markdown', () => {
  const htmlDocument = new DOMParser().parseFromString(
    '<span data-libre-attachment-source="![[Missing.png]]" data-libre-attachment-status="broken"><img alt="Missing.png could not be found."></span>',
    'text/html'
  );

  expect(getAttachmentMarkdown(htmlDocument.body.firstElementChild as HTMLElement)).toBe(
    '![[Missing.png]]'
  );
});

test('maps multiple image facts to embed containers instead of nested images', () => {
  const htmlSource = [
    '<span class="internal-embed image-embed"><img alt="Local"></span>',
    '<span class="internal-embed file-embed mod-empty-attachment" alt="Missing.png">Missing.png could not be found.</span>',
  ].join('');

  const annotatedHtml = annotateAttachmentHtml(htmlSource, [
    { text: '![[Local.png]]', type: 'embed' },
    { text: '![[Missing.png]]', type: 'embed' },
  ]);

  expect(annotatedHtml).toContain('data-libre-attachment-source="![[Local.png]]"');
  expect(annotatedHtml).toContain('data-libre-attachment-source="![[Missing.png]]"');
  expect(annotatedHtml).not.toContain('<img alt="Local" data-libre-attachment-source');
});

test('exports image embeds as Obsidian syntax and updates renamed paths', () => {
  const htmlDocument = new DOMParser().parseFromString(
    '<span data-libre-attachment-source="![[Old.png]]" data-href="Renamed.png"><img alt="Caption"></span>',
    'text/html'
  );

  expect(getAttachmentMarkdown(htmlDocument.body.firstElementChild as HTMLElement)).toBe(
    '![[Renamed.png|Caption]]'
  );
});

test('exports remote images as standard markdown images', () => {
  const htmlDocument = new DOMParser().parseFromString(
    '<img alt="Remote caption" src="https://example.com/image.png">',
    'text/html'
  );

  expect(getAttachmentMarkdown(htmlDocument.body.firstElementChild as HTMLElement)).toBe(
    '![Remote caption](https://example.com/image.png)'
  );
});

test('preserves annotated markdown image source when remote src was stripped', () => {
  const htmlDocument = new DOMParser().parseFromString(
    '<img alt="Remote caption" data-libre-attachment-source="![Remote caption](https://example.com/image.png)">',
    'text/html'
  );

  expect(getAttachmentMarkdown(htmlDocument.body.firstElementChild as HTMLElement)).toBe(
    '![Remote caption](https://example.com/image.png)'
  );
});

test('rejects traversal attachment paths instead of exporting embed syntax', () => {
  const htmlDocument = new DOMParser().parseFromString(
    '<span data-libre-attachment-path="../Secrets.png"><img alt="Secret"></span>',
    'text/html'
  );

  expect(getAttachmentMarkdown(htmlDocument.body.firstElementChild as HTMLElement)).toBe(null);
});

test('rejects unsafe stored attachment sources when remote src is absent', () => {
  const htmlDocument = new DOMParser().parseFromString(
    '<img alt="Unsafe" data-libre-attachment-source="![Unsafe](data:text/html,bad)">',
    'text/html'
  );

  expect(getAttachmentMarkdown(htmlDocument.body.firstElementChild as HTMLElement)).toBe(null);
});

test('annotates standard markdown images with exact source', () => {
  const annotatedHtml = annotateAttachmentHtml(
    '<img alt="Remote caption" src="https://example.com/image.png">',
    [{ text: '![Remote caption](https://example.com/image.png)', type: 'markdown-image' }]
  );

  expect(annotatedHtml).toContain(
    'data-libre-attachment-source="![Remote caption](https://example.com/image.png)"'
  );
  expect(annotatedHtml).toContain('data-libre-attachment-status="remote"');

  expect(annotatedHtml).toContain('data-libre-remote-image-src="https://example.com/image.png"');
  expect(annotatedHtml).not.toContain('data-libre-attachment-path="https://example.com');

  const htmlDocument = new DOMParser().parseFromString(annotatedHtml, 'text/html');

  expect(htmlDocument.querySelector('img')?.getAttribute('src')).toBe(null);
});

test('annotates masked remote image placeholders without fetchable src attributes', () => {
  const annotatedHtml = annotateAttachmentHtml(
    [
      '<span alt="Remote one" src="libre-note-editor-remote-image-0.png" class="internal-embed is-loaded file-embed mod-empty-attachment">missing</span>',
      '<span alt="Remote two" src="libre-note-editor-remote-image-1.png" class="internal-embed is-loaded file-embed mod-empty-attachment">missing</span>',
    ].join(''),
    [
      { text: '![Remote one](https://example.com/one.png)', type: 'markdown-image' },
      { text: '![Remote two](https://cdn.example/two.png)', type: 'markdown-image' },
    ]
  );

  const htmlDocument = new DOMParser().parseFromString(annotatedHtml, 'text/html');
  const elements = htmlDocument.querySelectorAll('[data-libre-remote-image-src]');

  expect(elements).toHaveLength(2);

  expect(elements[0]?.getAttribute('src')).toBe(null);
  expect(elements[0]?.getAttribute('data-libre-attachment-source')).toBe(
    '![Remote one](https://example.com/one.png)'
  );

  expect(elements[1]?.getAttribute('data-libre-remote-image-src')).toBe(
    'https://cdn.example/two.png'
  );
});
