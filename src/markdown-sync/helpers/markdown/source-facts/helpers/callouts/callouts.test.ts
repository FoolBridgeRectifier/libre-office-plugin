import { collectCalloutFacts } from './callouts';

test('collects single-line and nested callout source ranges', () => {
  expect(collectCalloutFacts('Intro\n> [!custom]+ Title\n> Body\n> > Nested\nAfter')).toEqual([
    {
      sourceOffset: 6,
      text: '> [!custom]+ Title\n> Body\n> > Nested',
      type: 'callout',
    },
  ]);
});

test('ignores ordinary blockquotes that are not callouts', () => {
  expect(collectCalloutFacts('> regular quote')).toEqual([]);
});
