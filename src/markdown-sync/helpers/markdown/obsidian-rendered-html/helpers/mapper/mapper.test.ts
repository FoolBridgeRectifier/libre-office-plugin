import { mapRenderedMarkdownElementToHtml } from '../../helpers';

function createRenderedContainer(htmlSource: string): HTMLDivElement {
  const containerElement = document.createElement('div');

  containerElement.innerHTML = htmlSource;

  return containerElement;
}

test('preserves Obsidian rendered blocks and inline style classes', () => {
  const containerElement = createRenderedContainer(`
    <div class="markdown-preview-section">
      <div class="el-h2"><h2 data-heading="Heading">Heading</h2></div>
      <div class="el-p">
        <p><strong>bold <em>italic</em></strong><br><mark>marked</mark></p>
      </div>
      <div class="el-ul">
        <ul class="contains-task-list">
          <li data-task="x" class="task-list-item">
            <span class="list-bullet"></span>
            <input checked type="checkbox">
            Done
          </li>
        </ul>
      </div>
      <div class="el-pre">
        <pre class="language-ts">
          <code class="language-ts"><span class="token keyword">const</span> value = true;</code>
          <button class="copy-code-button">copy</button>
        </pre>
      </div>
    </div>
  `);

  const htmlSource = mapRenderedMarkdownElementToHtml(containerElement);

  expect(htmlSource).toContain(
    '<p><strong>bold <em>italic</em></strong><br><mark>marked</mark></p>'
  );

  expect(htmlSource).toContain('class="task-list-item"');
  expect(htmlSource).toContain('class="list-bullet"');
  expect(htmlSource).toContain('<input checked="" type="checkbox">');

  expect(htmlSource).not.toContain('copy-code-button');

  expect(htmlSource).toContain('class="token keyword"');
  expect(htmlSource).toContain('<pre class="language-ts">');
});

test('preserves Obsidian callout html for theme styling', () => {
  const containerElement = createRenderedContainer(`
    <div class="markdown-preview-section">
      <div class="el-div">
        <div data-callout="warning" data-callout-fold="-" class="callout">
          <div class="callout-title">
            <div class="callout-icon">icon</div>
            <div class="callout-title-inner"><strong>Careful</strong></div>
          </div>
          <div class="callout-content"><p>Nested content</p></div>
        </div>
      </div>
    </div>
  `);

  const htmlSource = mapRenderedMarkdownElementToHtml(containerElement);

  expect(htmlSource).toContain('class="callout"');
  expect(htmlSource).toContain('data-callout="warning"');
  expect(htmlSource).toContain('data-callout-fold="-"');
  expect(htmlSource).toContain('class="callout-icon"');

  expect(htmlSource).toContain('<div class="callout-title-inner"><strong>Careful</strong></div>');
  expect(htmlSource).toContain('<div class="callout-content"><p>Nested content</p></div>');
});

test('repairs escaped heading emphasis after raw styled span rendering', () => {
  const containerElement = createRenderedContainer(`
    <div class="markdown-preview-section">
      <h1 data-heading="&lt;span style=&quot;margin-left:24px&quot;/&gt;\\*Heading 1" dir="auto">
        <span style="margin-left:24px">*Heading 1</span>
      </h1>
    </div>
  `);

  const htmlSource = mapRenderedMarkdownElementToHtml(containerElement);

  expect(htmlSource).toContain('<span style="margin-left:24px"><em>Heading 1</em></span>');
  expect(htmlSource).not.toContain('>*Heading 1<');
});

test('does not repair escaped heading spans that already contain rendered children', () => {
  const containerElement = createRenderedContainer(`
    <div class="markdown-preview-section">
      <h2 data-heading="\\*Already rendered">
        <span style="margin-left:24px"><em>*Already rendered</em></span>
      </h2>
      <h3 data-heading="\\*Plain rendered">
        <span style="margin-left:24px">Plain rendered</span>
      </h3>
    </div>
  `);

  const htmlSource = mapRenderedMarkdownElementToHtml(containerElement);

  expect(htmlSource).toContain('<em>*Already rendered</em>');
  expect(htmlSource).toContain('<span style="margin-left:24px">Plain rendered</span>');
});

test('skips escaped heading repair when a rendered span has no readable text', () => {
  const textContentProperty = jest
    .spyOn(Node.prototype, 'textContent', 'get')
    .mockReturnValue(null);

  const containerElement = createRenderedContainer(`
    <div class="markdown-preview-section">
      <h2 data-heading="\\*Unreadable">
        <span style="margin-left:24px">*</span>
      </h2>
    </div>
  `);

  const htmlSource = mapRenderedMarkdownElementToHtml(containerElement);

  expect(htmlSource).not.toContain('<em>');

  textContentProperty.mockRestore();
});

test('preserves unknown rendered html instead of restyling it', () => {
  const containerElement = createRenderedContainer(`
    <div class="markdown-preview-section">
      <section data-custom="kept"><span>Custom content</span></section>
    </div>
  `);

  const htmlSource = mapRenderedMarkdownElementToHtml(containerElement);

  expect(htmlSource).toContain('<section data-custom="kept"><span>Custom content</span></section>');
  expect(htmlSource).toContain('Custom content');
});
