import { fireEvent, render, screen } from '@testing-library/react';

import { RibbonEditor } from './RibbonEditor';

test('sets the Home ribbon tab active by default', () => {
  const { container } = render(<RibbonEditor />);

  expect(screen.getByRole('button', { name: 'Home' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByLabelText('Home commands')).toHaveTextContent('Basic Text');
  expect(container).toMatchSnapshot();
});

test('switches to insert commands when Insert is clicked', () => {
  render(<RibbonEditor />);

  fireEvent.click(screen.getByRole('button', { name: 'Insert' }));

  expect(screen.getByLabelText('Insert commands')).toHaveTextContent('Objects');
  expect(
    screen.getByRole('button', { name: 'Insert an image and keep the markdown reference in sync.' })
  ).toBeInTheDocument();
});

test('keeps keyboard focus styling on ribbon tabs', () => {
  render(<RibbonEditor />);

  expect(screen.getByRole('button', { name: 'Home' })).toHaveClass('focus-visible:outline');
  expect(screen.getByRole('button', { name: 'Home' })).toHaveClass(
    'focus-visible:outline-button-focus-ring'
  );
});

test('shows future insert commands as disabled controls', () => {
  render(<RibbonEditor />);

  fireEvent.click(screen.getByRole('button', { name: 'Insert' }));

  expect(screen.getByText('Table')).toBeVisible();
  expect(
    screen.getByRole('button', { name: 'Add a table once structured blocks are available.' })
  ).toBeDisabled();
});

test('shows dirty autosave status from the editor view', () => {
  render(
    <RibbonEditor
      activeFilePath="Dirty.md"
      autosaveStatus="dirty"
      importedHtmlSource="<article><p>Original body</p></article>"
    />
  );

  expect(screen.getByLabelText('HTML source status')).toHaveTextContent('Unsaved HTML changes');
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

test('shows active source, mode, and layout status labels', () => {
  render(
    <RibbonEditor
      activeEditorSource="desktop-odt"
      editorMode="desktop-odt"
      pageLayout="page-width"
    />
  );

  expect(screen.getByLabelText('Active editor source')).toHaveTextContent('Desktop ODT source');
  expect(screen.getByLabelText('Editor mode')).toHaveTextContent('Desktop ODT mode');
  expect(screen.getByLabelText('Editor layout')).toHaveTextContent('Page width layout');
});

test('applies page-width chrome only at desktop breakpoints', () => {
  render(
    <RibbonEditor
      importedHtmlSource="<article><p>Page width body</p></article>"
      pageLayout="page-width"
    />
  );

  expect(screen.getByLabelText('Editor surface')).toHaveClass('p-0');
  expect(screen.getByLabelText('Editor surface')).toHaveClass('libre-page-width');
});

test('shows only the top corner ODT loader while desktop source work is running', () => {
  render(
    <RibbonEditor
      activeFilePath="Loaded.md"
      desktopSourceStatus="loading"
      importedHtmlSource={null}
    />
  );

  const spinnerElement = screen.getByLabelText('ODT source loading').querySelector('[aria-hidden]');

  if (!spinnerElement) {
    throw new Error('Expected loading status to include a visible spinner indicator.');
  }

  expect(screen.getByLabelText('ODT source loading')).toHaveTextContent('ODT');
  expect(spinnerElement).toHaveClass('motion-reduce:animate-none');
  expect(screen.getByLabelText('HTML source status')).toHaveTextContent('HTML source saved');
  expect(screen.queryByText('No rich HTML source loaded.')).toBeNull();
});

test('shows a top corner ODT error when desktop source conversion fails', () => {
  render(
    <RibbonEditor
      activeFilePath="Loaded.md"
      autosaveStatus="error"
      desktopSourceStatus="error"
      importedHtmlSource="<article><p>Previous body</p></article>"
    />
  );

  expect(screen.getByLabelText('ODT source error')).toHaveTextContent('ODT error');
  expect(screen.getByLabelText('HTML source status')).toHaveTextContent('Autosave error');
});

test('shows conflict recovery choices when a resolver is available', () => {
  const handleResolveConflict = jest.fn();

  render(
    <RibbonEditor
      autosaveStatus="conflicted"
      importedHtmlSource="<article><p>Conflicted</p></article>"
      onResolveConflict={handleResolveConflict}
    />
  );

  fireEvent.click(screen.getByRole('button', { name: 'Mobile' }));

  expect(screen.getByLabelText('Conflict recovery')).toBeInTheDocument();
  expect(handleResolveConflict).toHaveBeenCalledWith('mobile');
});

test('shows unresolved Obsidian link warning count', () => {
  render(<RibbonEditor linkWarningCount={2} />);

  expect(screen.getByLabelText('Obsidian link warnings')).toHaveTextContent(
    '2 unresolved link targets'
  );
});

test('emits changed html source from the local editor', () => {
  const handleHtmlSourceChange = jest.fn();

  render(
    <RibbonEditor
      activeFilePath="Dirty.md"
      importedHtmlSource="<article><p>Original body</p></article>"
      onHtmlSourceChange={handleHtmlSourceChange}
    />
  );

  const editorElement = screen.getByRole('textbox', { name: 'Local HTML editor' });

  editorElement.innerHTML = '<article><p>Changed body</p></article>';
  fireEvent.input(editorElement);

  expect(handleHtmlSourceChange).toHaveBeenCalledWith('<article><p>Changed body</p></article>');
});

test('passes tag navigation through to the local editor', () => {
  const handleTagNavigate = jest.fn();

  render(
    <RibbonEditor
      activeFilePath="Tags.md"
      importedHtmlSource='<article><p><a class="tag" href="#parent/child" data-libre-obsidian-tag-source="#parent/child">#parent/child</a></p></article>'
      onTagNavigate={handleTagNavigate}
    />
  );

  fireEvent.click(screen.getByText('#parent/child'));

  expect(handleTagNavigate).toHaveBeenCalledWith('#parent/child');
});
