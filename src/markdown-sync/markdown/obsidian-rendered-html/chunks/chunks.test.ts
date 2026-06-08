import { splitMarkdownIntoRenderedChunks } from './chunks';

test('splits rendered markdown chunks without breaking fenced code blocks', () => {
  const chunks = splitMarkdownIntoRenderedChunks(
    [
      'Before',
      '',
      '```ts',
      'const value = true;',
      '',
      '~~~',
      'still code',
      '```',
      '',
      'After',
    ].join('\n')
  );

  expect(chunks).toEqual(['Before', '```ts\nconst value = true;\n\n~~~\nstill code\n```', 'After']);
});

test('drops empty rendered markdown chunks', () => {
  expect(splitMarkdownIntoRenderedChunks('\n\n   \n')).toEqual([]);
});
