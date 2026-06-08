import { annotateTableHtml, getTableMarkdown } from './tables';

const readInlineMarkdown = (node: Node) => node.textContent ?? '';

test('exports simple tables as markdown tables', () => {
  const htmlDocument = new DOMParser().parseFromString(
    '<table><thead><tr><th>Name</th><th align="right">Count</th></tr></thead><tbody><tr><td>A|B</td><td>2</td></tr></tbody></table>',
    'text/html'
  );

  expect(
    getTableMarkdown(htmlDocument.querySelector('table') as HTMLElement, readInlineMarkdown)
  ).toBe(['| Name | Count |', '| --- | ---: |', '| A\\|B | 2 |'].join('\n'));
});

test('preserves complex tables as protected sanitized html', () => {
  const annotatedHtml = annotateTableHtml(
    [
      '<table onclick="bad()">',
      '<tr><td colspan="2" style="background:url(https://example.com/track.png)">Merged</td></tr>',
      '<tr><td><a href="data:text/html,bad">Unsafe</a></td></tr>',
      '<script>bad()</script>',
      '</table>',
    ].join('')
  );

  expect(annotatedHtml).toContain('data-libre-table-kind="complex"');
  expect(annotatedHtml).toContain('data-libre-protected="complex-table"');
  expect(annotatedHtml).not.toContain('onclick');

  expect(annotatedHtml).not.toContain('data:text/html');
  expect(annotatedHtml).not.toContain('background:url');
  expect(annotatedHtml).not.toContain('<script>');
});

test('wraps tables for horizontal scrolling on narrow viewports', () => {
  const annotatedHtml = annotateTableHtml('<table><tr><td>A</td></tr></table>');

  expect(annotatedHtml).toContain('libre-table-scroll overflow-x-auto max-w-full');
});

test('exports simple table captions as nearby markdown text', () => {
  const htmlDocument = new DOMParser().parseFromString(
    '<table><caption>Caption</caption><tr><th>A</th></tr><tr><td>B</td></tr></table>',
    'text/html'
  );

  expect(
    getTableMarkdown(htmlDocument.querySelector('table') as HTMLElement, readInlineMarkdown)
  ).toBe(['Caption', '', '| A |', '| --- |', '| B |'].join('\n'));
});
