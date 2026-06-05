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
