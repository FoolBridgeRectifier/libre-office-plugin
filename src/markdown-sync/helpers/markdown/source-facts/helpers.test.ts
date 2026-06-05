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

test('collects Obsidian tags outside fenced code blocks', () => {
  const sourceFacts = collectMarkdownSourceFacts(
    '#parent/child outside\n\n```md\n#not-a-tag\n```\n\nEscaped \\#hash'
  );

  expect(sourceFacts.facts).toContainEqual({
    text: '#parent/child',
    type: 'tag',
  });

  expect(sourceFacts.facts).not.toContainEqual({
    text: '#not-a-tag',
    type: 'tag',
  });
});

test('collects callouts and inline code as structured source facts', () => {
  const sourceFacts = collectMarkdownSourceFacts(
    [
      '> [!warning]- Custom title',
      '> Body with `inline code`',
      '> > [!info] Nested',
      '',
      'After ``code with ` inside``.',
    ].join('\n')
  );

  expect(sourceFacts.facts).toContainEqual({
    text: '> [!warning]- Custom title\n> Body with `inline code`\n> > [!info] Nested',
    type: 'callout',
  });

  expect(sourceFacts.facts).toContainEqual({
    text: '``code with ` inside``',
    type: 'inline-code',
  });
});

test('does not collect inline code inside fenced code blocks', () => {
  const sourceFacts = collectMarkdownSourceFacts('```md\n`not inline`\n```\n\n`inline`');

  expect(sourceFacts.facts).toContainEqual({
    text: '`inline`',
    type: 'inline-code',
  });

  expect(sourceFacts.facts).not.toContainEqual({
    text: '`not inline`',
    type: 'inline-code',
  });
});

test('collects standard markdown image sources', () => {
  const sourceFacts = collectMarkdownSourceFacts(
    'Before ![Remote caption](https://example.com/image.png) after'
  );

  expect(sourceFacts.facts).toContainEqual({
    text: '![Remote caption](https://example.com/image.png)',
    type: 'markdown-image',
  });
});

test('keeps source facts in markdown source order', () => {
  const sourceFacts = collectMarkdownSourceFacts('#tag before [[Note]] and ^block');

  expect(sourceFacts.facts.map((sourceFact) => sourceFact.type)).toEqual([
    'tag',
    'wikilink',
    'block-id',
  ]);
});
