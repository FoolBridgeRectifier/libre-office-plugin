import { render, screen } from '@testing-library/react';

import { RibbonEditor } from './RibbonEditor';

test('shows dirty autosave status from the editor view', () => {
  const { container } = render(
    <RibbonEditor
      activeFilePath="Dirty.md"
      autosaveStatus="dirty"
      importedHtmlSource="<article><p>Original body</p></article>"
    />
  );

  expect(screen.getByLabelText('HTML source status')).toHaveTextContent('Unsaved HTML changes');

  expect(container).toMatchSnapshot();
});

test.each([
  ['saved', 'HTML source saved'],
  ['saving', 'Saving HTML'],
  ['syncing-markdown', 'Syncing markdown'],
  ['conflicted', 'Conflict detected'],
  ['error', 'Autosave error'],
] as const)('shows %s status label', (autosaveStatus, expectedLabel) => {
  render(<RibbonEditor autosaveStatus={autosaveStatus} />);

  expect(screen.getByLabelText('HTML source status')).toHaveTextContent(expectedLabel);
});

test('shows layout status label', () => {
  render(<RibbonEditor pageLayout="page-width" />);

  expect(screen.getByLabelText('Editor layout')).toHaveTextContent('Page width layout');
});
