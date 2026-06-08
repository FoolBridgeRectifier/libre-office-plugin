import { splitFrontmatter } from '..';

test('splits valid frontmatter without reordering keys', () => {
  const markdownSource = '---\ntitle: Alpha\ntags: [one, two]\n---\n# Body';

  expect(splitFrontmatter('No frontmatter').frontmatter).toBe(null);
  expect(splitFrontmatter(markdownSource).frontmatter).toBe('title: Alpha\ntags: [one, two]');
  expect(splitFrontmatter(markdownSource).bodyMarkdown).toBe('# Body');
});

test('leaves invalid or body-like frontmatter delimiters in markdown body', () => {
  const invalidFrontmatter = '---\ntitle Alpha\n---\nBody';
  const bodyBeginningWithDelimiter = '---\nThis is a horizontal-rule style opening';

  expect(splitFrontmatter(invalidFrontmatter).frontmatter).toBe(null);
  expect(splitFrontmatter(invalidFrontmatter).bodyMarkdown).toBe(invalidFrontmatter);

  expect(splitFrontmatter(bodyBeginningWithDelimiter).frontmatter).toBe(null);
  expect(splitFrontmatter(bodyBeginningWithDelimiter).bodyMarkdown).toBe(
    bodyBeginningWithDelimiter
  );
});
