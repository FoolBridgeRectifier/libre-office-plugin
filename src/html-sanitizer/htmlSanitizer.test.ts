import {
  sanitizeConvertedHtmlSource,
  sanitizeConvertedHtmlSourceWithReport,
  sanitizeHtmlFragmentSourceWithReport,
} from './htmlSanitizer';

test('wraps converted body HTML in an article when none exists', () => {
  const sanitizedHtml = sanitizeConvertedHtmlSource('<p>Body</p>');

  expect(sanitizedHtml).toBe('<article><p>Body</p></article>');
});

test('protects desktop-only content and strips executable HTML', () => {
  const sanitizedHtml = sanitizeConvertedHtmlSource(
    '<article><footer onclick="bad()">Footer</footer><a href="javascript:bad()">Link</a><script>bad()</script></article>'
  );

  expect(sanitizedHtml).toContain('data-libre-desktop-only="true"');
  expect(sanitizedHtml).not.toContain('onclick');
  expect(sanitizedHtml).not.toContain('javascript:');
  expect(sanitizedHtml).not.toContain('<script>');
});

test('neutralizes dangerous converted URLs and style asset loads', () => {
  const sanitizedHtml = sanitizeConvertedHtmlSource(
    [
      '<article>',
      '<a href="vbscript:bad()">VB</a>',
      '<img src="data:text/html,bad">',
      '<p style="background-image: url(https://example.com/track.png)">Styled</p>',
      '</article>',
    ].join('')
  );

  expect(sanitizedHtml).not.toContain('vbscript:');
  expect(sanitizedHtml).not.toContain('data:text/html');
  expect(sanitizedHtml).not.toContain('background-image');
});

test('marks page layout, comments, and tracked changes as desktop-only', () => {
  const sanitizedHtml = sanitizeConvertedHtmlSource(
    '<article><header>H</header><footer>F</footer><p style="page-break-before: always">P</p><span class="comment">C</span><span class="tracked-change">T</span></article>'
  );
  const htmlDocument = new DOMParser().parseFromString(sanitizedHtml, 'text/html');

  const protectedElements = htmlDocument.querySelectorAll(
    '[data-libre-protected="desktop-only"][contenteditable="false"]'
  );

  expect(protectedElements.length).toBe(5);
});

test('protects remote converted images without fetching them', () => {
  const sanitizedHtml = sanitizeConvertedHtmlSource(
    '<article><img src="https://example.com/image.png"><img src="local.png"></article>'
  );

  const htmlDocument = new DOMParser().parseFromString(sanitizedHtml, 'text/html');
  const remoteImageElement = htmlDocument.querySelector('[data-libre-remote-image-src]');

  expect(sanitizedHtml).toContain('data-libre-remote-image-src="https://example.com/image.png"');
  expect(sanitizedHtml).toContain('src="local.png"');
  expect(remoteImageElement?.getAttribute('src')).toBe(null);
});

test('removes executable converted styles and remote image source sets', () => {
  const sanitizedHtml = sanitizeConvertedHtmlSource(
    [
      '<article>',
      '<style>@import "https://example.com/bad.css";</style>',
      '<link rel="stylesheet" href="https://example.com/bad.css">',
      '<p style="background-image: url(javascript:bad())">Styled</p>',
      '<img srcset="https://example.com/a.png 1x, local.png 2x" src="local.png">',
      '</article>',
    ].join('')
  );

  expect(sanitizedHtml).not.toContain('<style');
  expect(sanitizedHtml).not.toContain('<link');
  expect(sanitizedHtml).not.toContain('javascript:');
  expect(sanitizedHtml).not.toContain('srcset');
});

test('reports unsafe content removal for converted documents', () => {
  const sanitizationResult = sanitizeConvertedHtmlSourceWithReport(
    '<article><p onclick="bad()">Body</p></article>'
  );

  expect(sanitizationResult.removedUnsafeContent).toBe(true);
  expect(sanitizationResult.htmlSource).toBe('<article><p>Body</p></article>');
});

test('sanitizes source fragments without forcing an article wrapper', () => {
  const sanitizationResult = sanitizeHtmlFragmentSourceWithReport(
    '<p onclick="bad()">Body</p><script>bad()</script>'
  );

  expect(sanitizationResult.removedUnsafeContent).toBe(true);
  expect(sanitizationResult.htmlSource).toBe('<p>Body</p>');
});
