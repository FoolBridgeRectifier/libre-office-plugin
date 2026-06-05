import { MarkdownRenderer } from 'obsidian';

import {
  convertMarkdownToHtmlWithObsidianRenderer,
  renderMarkdownWithObsidian,
} from '../../../helpers';
import type { App } from 'obsidian';
import type { MarkdownBodyRenderer } from '../../../interfaces';

function createRenderedContainer(htmlSource: string): HTMLDivElement {
  const containerElement = document.createElement('div');

  containerElement.innerHTML = htmlSource;

  return containerElement;
}

test('renders markdown with Obsidian and unloads the render component', async () => {
  const containerElement = document.createElement('div');
  const app = {} as App;

  await renderMarkdownWithObsidian(app, '# Heading', containerElement, 'Rendered.md');

  expect(MarkdownRenderer.render).toHaveBeenCalledWith(
    app,
    '# Heading',
    containerElement,
    'Rendered.md',
    expect.objectContaining({
      load: expect.any(Function),
      unload: expect.any(Function),
    })
  );
});

test('converts markdown through injected Obsidian renderer and preserves frontmatter source', async () => {
  const markdownRenderer: jest.MockedFunction<MarkdownBodyRenderer> = jest.fn(
    async (bodyMarkdown, containerElement, _sourcePath) => {
      containerElement.innerHTML = `<div class="markdown-preview-section"><div class="el-h1"><h1>${bodyMarkdown.replace(
        '# ',
        ''
      )}</h1></div></div>`;
    }
  );

  const result = await convertMarkdownToHtmlWithObsidianRenderer(
    '---\ntitle: Rendered\n---\n# Rendered Heading',
    { markdownRenderer, sourcePath: 'Rendered.md' }
  );

  expect(markdownRenderer).toHaveBeenCalledWith(
    '# Rendered Heading',
    expect.any(HTMLElement),
    'Rendered.md'
  );

  expect(result.frontmatter).toBe('title: Rendered');

  expect(result.htmlSource).toContain(
    '<template data-libre-protected="frontmatter">title: Rendered</template>'
  );

  expect(result.htmlSource).toContain('class="markdown-rendered show-indentation-guide"');
  expect(result.htmlSource).toContain('data-libre-protected="markdown-source-facts"');
  expect(result.htmlSource).toContain('<h1>Rendered Heading</h1>');
});

test('stores source-only markdown facts for export reconciliation', async () => {
  const markdownRenderer: jest.MockedFunction<MarkdownBodyRenderer> = jest.fn(
    async (_bodyMarkdown, containerElement, _sourcePath) => {
      containerElement.innerHTML = '<p>Visible body</p>';
    }
  );

  const result = await convertMarkdownToHtmlWithObsidianRenderer(
    '[[Note|Alias]] ![[Image.png]] %%hidden%%\n\n```ts\nconst value = true;\n```\n\n^block',
    { markdownRenderer, sourcePath: 'Facts.md' }
  );

  const sourceFactsTemplate = createRenderedContainer(result.htmlSource).querySelector(
    'template[data-libre-protected="markdown-source-facts"]'
  );
  const sourceFactsJson = sourceFactsTemplate?.innerHTML ?? '';

  expect(sourceFactsJson).toContain('"type":"wikilink"');
  expect(sourceFactsJson).toContain('"type":"embed"');
  expect(sourceFactsJson).toContain('"type":"comment"');

  expect(sourceFactsJson).toContain('"type":"code-fence"');
  expect(sourceFactsJson).toContain('"type":"block-id"');
});

test('annotates rendered Obsidian link nodes with exact source markdown', async () => {
  const markdownRenderer: jest.MockedFunction<MarkdownBodyRenderer> = jest.fn(
    async (_bodyMarkdown, containerElement, _sourcePath) => {
      containerElement.innerHTML = [
        '<p>',
        '<a class="internal-link" data-href="Note#Heading">Alias</a> ',
        '<a class="tag" href="#parent/child">#parent/child</a>',
        '</p>',
      ].join('');
    }
  );

  const result = await convertMarkdownToHtmlWithObsidianRenderer(
    '[[Note#Heading|Alias]] #parent/child',
    { markdownRenderer, sourcePath: 'Links.md' }
  );

  expect(result.htmlSource).toContain('data-libre-obsidian-link-source="[[Note#Heading|Alias]]"');
  expect(result.htmlSource).toContain('data-libre-obsidian-tag-source="#parent/child"');
});

test('preserves raw markdown when Obsidian renders an empty non-empty body', async () => {
  const markdownRenderer: jest.MockedFunction<MarkdownBodyRenderer> = jest.fn(
    async (_bodyMarkdown, _containerElement, _sourcePath) => undefined
  );

  const result = await convertMarkdownToHtmlWithObsidianRenderer('# Fallback Heading', {
    markdownRenderer,
    sourcePath: 'Fallback.md',
  });

  expect(result.bodyHtml).toContain('data-libre-protected="raw-markdown"');
  expect(result.bodyHtml).toContain('# Fallback Heading');
  expect(result.htmlSource).toContain('data-libre-protected="markdown-source-facts"');
});

test('preserves raw markdown when Obsidian rendering is unavailable', async () => {
  const result = await convertMarkdownToHtmlWithObsidianRenderer('**Raw** <unsafe>', {
    sourcePath: 'Raw.md',
  });

  expect(result.bodyHtml).toContain('data-libre-protected="raw-markdown"');
  expect(result.bodyHtml).toContain('**Raw** &lt;unsafe&gt;');
});

test('returns an empty rendered body for empty markdown without renderer', async () => {
  const result = await convertMarkdownToHtmlWithObsidianRenderer('   ', {
    sourcePath: 'Empty.md',
  });

  expect(result.bodyHtml).toBe('');
  expect(result.htmlSource).not.toContain('data-libre-protected="raw-markdown"');
});

test('renders markdown chunks through Obsidian before raw markdown fallback', async () => {
  const markdownRenderer: jest.MockedFunction<MarkdownBodyRenderer> = jest.fn(
    async (bodyMarkdown, containerElement, _sourcePath) => {
      if (bodyMarkdown.includes('\n\n')) {
        return;
      }

      containerElement.innerHTML = `<div class="markdown-preview-section"><p>${bodyMarkdown}</p></div>`;
    }
  );

  const result = await convertMarkdownToHtmlWithObsidianRenderer(
    '# Chunk One\n\n> [!info] Chunk Two',
    {
      markdownRenderer,
      sourcePath: 'Chunks.md',
    }
  );

  expect(result.bodyHtml).toContain('<p># Chunk One</p>');
  expect(result.bodyHtml).toContain('<p>&gt; [!info] Chunk Two</p>');
  expect(result.htmlSource).toContain('class="markdown-rendered show-indentation-guide"');
});
