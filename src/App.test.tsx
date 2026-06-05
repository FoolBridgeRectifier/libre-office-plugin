import { fireEvent, render, screen } from '@testing-library/react';

import { App } from './App';

test('renders the OneNote-style ribbon editor shell', () => {
  const { container } = render(<App />);

  expect(screen.getByRole('navigation', { name: 'Ribbon tabs' })).toHaveTextContent('Home');
  expect(screen.getByLabelText('Empty HTML editor')).toHaveTextContent(
    'No rich HTML source loaded.'
  );

  expect(screen.getByLabelText('HTML source status')).toHaveTextContent('No HTML source loaded');

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
