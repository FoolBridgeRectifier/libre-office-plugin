import { collectMarkdownSourceFacts } from './helpers';

test('collects valid fenced code blocks as source facts', () => {
  const sourceFacts = collectMarkdownSourceFacts(
    'Before\n\n```ts\nconst value = true;\n```\n\nAfter'
  );

  expect(sourceFacts.facts).toContainEqual({
    text: '```ts\nconst value = true;\n```',
    type: 'code-fence',
  });
});

test('does not treat backtick info strings containing backticks as fences', () => {
  const sourceFacts = collectMarkdownSourceFacts('```bad``` still inline\n\n## Later heading');

  expect(sourceFacts.facts.some((sourceFact) => sourceFact.type === 'code-fence')).toBe(false);
});

test('keeps reading fenced code until the matching marker closes it', () => {
  const sourceFacts = collectMarkdownSourceFacts('```ts\ninside\n~~~\nstill inside\n```\n\nDone');

  expect(sourceFacts.facts).toContainEqual({
    text: '```ts\ninside\n~~~\nstill inside\n```',
    type: 'code-fence',
  });
});
