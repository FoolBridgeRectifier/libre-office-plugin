import { collectInlineCodeFacts } from './inlineCode';

test('collects inline code and skips excluded ranges', () => {
  expect(
    collectInlineCodeFacts('`skip` and ``keep ` inside``', [{ endOffset: 6, startOffset: 0 }])
  ).toEqual([
    {
      sourceOffset: 11,
      text: '``keep ` inside``',
      type: 'inline-code',
    },
  ]);
});

test('ignores unterminated inline code markers', () => {
  expect(collectInlineCodeFacts('Before `unterminated', [])).toEqual([]);
});
