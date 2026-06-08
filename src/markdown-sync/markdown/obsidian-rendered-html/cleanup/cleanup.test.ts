import { cleanRenderedMarkdownElement } from '..';

function createRenderedContainer(htmlSource: string): HTMLDivElement {
  const containerElement = document.createElement('div');

  containerElement.innerHTML = htmlSource;

  return containerElement;
}

test('cleans Obsidian preview chrome while preserving rendered style hooks', () => {
  const containerElement = createRenderedContainer(`
    <div class="markdown-preview-view">
      <div class="markdown-preview-section">
        <div class="markdown-preview-pusher"></div>
        <div class="mod-header">Title UI</div>
        <div class="metadata-container">Properties UI</div>
        <div class="el-h1">
          <h1 data-heading="Heading">
            <span class="heading-collapse-indicator">collapse</span>
            Heading
          </h1>
        </div>
      </div>
    </div>
  `);

  const cleanedElement = cleanRenderedMarkdownElement(containerElement);

  expect(cleanedElement.textContent).toContain('Heading');
  expect(cleanedElement.textContent).not.toContain('Title UI');
  expect(cleanedElement.textContent).not.toContain('Properties UI');
  expect(cleanedElement.querySelector('.heading-collapse-indicator')).toBeInstanceOf(HTMLElement);
});

test('removes hidden generated content outside callout bodies', () => {
  const containerElement = createRenderedContainer(`
    <article>
      <p hidden>Hidden by attribute</p>
      <p aria-hidden="true">Hidden by aria</p>
      <p style="display: none;">Hidden by style</p>
      <div class="callout-content">
        <p hidden>Kept hidden attribute body</p>
        <p style="display: none;">Kept hidden style body</p>
      </div>
      <p>Visible content</p>
    </article>
  `);

  const cleanedElement = cleanRenderedMarkdownElement(containerElement);

  expect(cleanedElement.textContent).toContain('Kept hidden attribute body');
  expect(cleanedElement.textContent).toContain('Kept hidden style body');
  expect(cleanedElement.textContent).toContain('Visible content');

  expect(cleanedElement.textContent).not.toContain('Hidden by attribute');
  expect(cleanedElement.textContent).not.toContain('Hidden by aria');
  expect(cleanedElement.textContent).not.toContain('Hidden by style');
});
