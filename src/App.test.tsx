import { fireEvent, render, screen } from '@testing-library/react';

import { App } from './App';

test('renders the OneNote-style ribbon editor shell', () => {
  const { container } = render(<App />);

  expect(screen.getByRole('navigation', { name: 'Ribbon tabs' })).toHaveTextContent('Home');
  expect(screen.getByLabelText('Empty HTML editor')).toHaveTextContent('');
  expect(screen.queryByText('No rich HTML source loaded.')).toBeNull();

  expect(screen.getByLabelText('HTML source status')).toHaveTextContent('HTML source saved');

  expect(container).toMatchSnapshot();
});

test('switches ribbon tabs to show insert commands', () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: 'Insert' }));

  expect(
    screen.getByRole('button', { name: 'Insert an image and keep the markdown reference in sync.' })
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Insert' })).toHaveAttribute('aria-pressed', 'true');
});

test('shows the active markdown file path when a note is loaded', () => {
  render(<App activeFilePath="Folder/Plan.md" />);

  expect(screen.getByLabelText('Active markdown file')).toHaveTextContent('Folder/Plan.md');
});

test('shows unresolved link warnings from the editor view', () => {
  render(<App linkWarningCount={1} />);

  expect(screen.getByLabelText('Obsidian link warnings')).toHaveTextContent(
    '1 unresolved link target'
  );
});

test('passes conflict recovery choices through to the ribbon editor', () => {
  const handleResolveConflict = jest.fn();

  render(<App autosaveStatus="conflicted" onResolveConflict={handleResolveConflict} />);

  fireEvent.click(screen.getByRole('button', { name: 'Duplicate' }));

  expect(handleResolveConflict).toHaveBeenCalledWith('duplicate-conflict-copy');
});

test('passes internal link navigation through to the editor surface', () => {
  const handleInternalLinkNavigate = jest.fn();

  render(
    <App
      activeFilePath="Links.md"
      importedHtmlSource='<article><p><a class="internal-link" data-href="Target">Target</a></p></article>'
      onInternalLinkNavigate={handleInternalLinkNavigate}
    />
  );

  fireEvent.click(screen.getByText('Target'));

  expect(handleInternalLinkNavigate).toHaveBeenCalledWith('Target');
});

test('renders imported html without showing preserved frontmatter as text', () => {
  render(
    <App
      activeFilePath="Imported.md"
      importedHtmlSource='<article><template data-libre-protected="frontmatter">title: Hidden</template><h1>Imported title</h1><p>Readable body</p></article>'
    />
  );

  expect(screen.getByRole('heading', { name: 'Imported title' })).toBeInTheDocument();
  expect(screen.getByText('Readable body')).toBeInTheDocument();
  expect(screen.queryByText('title: Hidden')).not.toBeInTheDocument();
});
