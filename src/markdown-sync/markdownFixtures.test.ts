import { readFileSync } from 'fs';

import { convertMarkdownToHtml } from './helpers';

function readMockMarkdownFixture(fileName: string): string {
  return readFileSync(`mocks/${fileName}`, 'utf8').replace(/\r\n/g, '\n');
}

function createHtmlSnapshotContainer(htmlSource: string): HTMLDivElement {
  const snapshotContainerElement = document.createElement('div');

  snapshotContainerElement.innerHTML = htmlSource;

  return snapshotContainerElement;
}

test('matches md_1 markdown conversion snapshot', () => {
  const markdownSource = readMockMarkdownFixture('md_1.md');
  const result = convertMarkdownToHtml(markdownSource);
  const snapshotContainerElement = createHtmlSnapshotContainer(result.htmlSource);

  expect({
    frontmatter: result.frontmatter,
    html: snapshotContainerElement,
  }).toMatchSnapshot();
});

test('matches md_2 complex nested markdown conversion snapshot', () => {
  const markdownSource = readMockMarkdownFixture('md_2.md');
  const result = convertMarkdownToHtml(markdownSource);
  const snapshotContainerElement = createHtmlSnapshotContainer(result.htmlSource);

  expect({
    frontmatter: result.frontmatter,
    html: snapshotContainerElement,
  }).toMatchSnapshot();
});
