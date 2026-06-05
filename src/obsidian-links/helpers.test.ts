import {
  annotateObsidianLinkHtml,
  createObsidianWikiLinkSource,
  getObsidianInlineMarkdown,
  parseObsidianWikiLinkSource,
} from './helpers';

function createElementFromHtml(htmlSource: string): HTMLElement {
  const containerElement = document.createElement('div');

  containerElement.innerHTML = htmlSource;

  return containerElement.firstElementChild as HTMLElement;
}

test('parses Obsidian wiki link targets, aliases, embeds, headings, and blocks', () => {
  expect(parseObsidianWikiLinkSource('[[Note#Heading|Alias]]')).toStrictEqual({
    alias: 'Alias',
    embedded: false,
    target: 'Note#Heading',
  });

  expect(parseObsidianWikiLinkSource('![[Note#^block-id]]')).toStrictEqual({
    alias: null,
    embedded: true,
    target: 'Note#^block-id',
  });
});

test('serializes Obsidian wiki links without changing target case', () => {
  expect(
    createObsidianWikiLinkSource({
      alias: 'Heading Alias',
      embedded: false,
      target: 'Note#Heading',
    })
  ).toBe('[[Note#Heading|Heading Alias]]');
});

test('exports edited link text as an alias while preserving the stored target', () => {
  const linkElement = createElementFromHtml(
    '<a data-libre-obsidian-link-source="[[Note#Heading]]">Renamed visible text</a>'
  );

  expect(getObsidianInlineMarkdown(linkElement)).toBe('[[Note#Heading|Renamed visible text]]');
});

test('preserves links when Obsidian renders default heading and block labels', () => {
  const headingLinkElement = createElementFromHtml(
    '<a data-libre-obsidian-link-source="[[Folder/Note#Heading]]">Note &gt; Heading</a>'
  );

  const blockLinkElement = createElementFromHtml(
    '<a data-libre-obsidian-link-source="[[Folder/Note#^block-id]]">Note &gt; ^block-id</a>'
  );

  expect(getObsidianInlineMarkdown(headingLinkElement)).toBe('[[Folder/Note#Heading]]');
  expect(getObsidianInlineMarkdown(blockLinkElement)).toBe('[[Folder/Note#^block-id]]');
});

test('annotates rendered internal links with exact Obsidian source facts', () => {
  const htmlSource =
    '<p><a class="internal-link" data-href="Note#Heading">Alias</a> <span class="internal-embed"></span> <a class="tag" href="#parent/child">#parent/child</a></p>';

  expect(
    annotateObsidianLinkHtml(htmlSource, [
      { text: '[[Note#Heading|Alias]]', type: 'wikilink' },
      { text: '![[File.png]]', type: 'embed' },
      { text: '#parent/child', type: 'tag' },
      { text: '^block-id', type: 'block-id' },
    ])
  ).toContain('data-libre-obsidian-link-source="[[Note#Heading|Alias]]"');

  expect(
    annotateObsidianLinkHtml(htmlSource, [
      { text: '[[Note#Heading|Alias]]', type: 'wikilink' },
      { text: '![[File.png]]', type: 'embed' },
    ])
  ).toContain('data-libre-obsidian-link-source="![[File.png]]"');
});
