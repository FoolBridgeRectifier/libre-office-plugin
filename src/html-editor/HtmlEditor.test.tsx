import { fireEvent, render, screen } from '@testing-library/react';

import { HtmlEditor } from './HtmlEditor';

test('shows an empty editor state without html source', () => {
  const { container } = render(<HtmlEditor htmlSource={null} />);

  expect(screen.getByLabelText('Empty HTML editor')).toHaveTextContent('');
  expect(screen.queryByText('No rich HTML source loaded.')).toBeNull();
  expect(container).toMatchSnapshot();
});

test('keeps the empty editor message hidden when empty state is disabled', () => {
  render(<HtmlEditor htmlSource={null} showEmptyState={false} />);

  expect(screen.getByLabelText('Blank HTML editor')).toHaveClass('min-h-64');
  expect(screen.getByLabelText('Blank HTML editor')).not.toHaveClass('border-dashed');
  expect(screen.queryByText('No rich HTML source loaded.')).toBeNull();
});

test('shows an editor initialization error state', () => {
  render(<HtmlEditor htmlSource="<p>Ignored</p>" initializationError="Unable to load editor." />);

  expect(screen.getByRole('alert', { name: 'HTML editor error' })).toHaveTextContent(
    'Unable to load editor.'
  );
});

test('loads html source into the local editor surface', () => {
  render(<HtmlEditor htmlSource="<article><h1>Loaded title</h1><p>Body</p></article>" />);

  expect(screen.getByRole('textbox', { name: 'Local HTML editor' })).toContainHTML(
    '<h1>Loaded title</h1>'
  );
});

test('emits changed html source and dirty state on editor input', () => {
  const handleHtmlSourceChange = jest.fn();
  const handleDirtyStateChange = jest.fn();

  render(
    <HtmlEditor
      htmlSource="<article><p>Original</p></article>"
      onDirtyStateChange={handleDirtyStateChange}
      onHtmlSourceChange={handleHtmlSourceChange}
    />
  );

  const editorElement = screen.getByRole('textbox', { name: 'Local HTML editor' });

  editorElement.innerHTML = '<article><p>Changed</p></article>';
  fireEvent.input(editorElement);

  expect(handleHtmlSourceChange).toHaveBeenLastCalledWith('<article><p>Changed</p></article>');
  expect(handleDirtyStateChange).toHaveBeenLastCalledWith(true);
});

test('emits editor blur for immediate autosave', () => {
  const handleEditorBlur = jest.fn();

  render(
    <HtmlEditor htmlSource="<article><p>Blur</p></article>" onEditorBlur={handleEditorBlur} />
  );

  fireEvent.blur(screen.getByRole('textbox', { name: 'Local HTML editor' }));

  expect(handleEditorBlur).toHaveBeenCalledTimes(1);
});

test('renders protected raw blocks as read-only editor content', () => {
  render(
    <HtmlEditor htmlSource='<article><pre data-libre-protected="raw-markdown"># Raw</pre></article>' />
  );

  const protectedElement = screen.getByText('# Raw');

  expect(protectedElement).toHaveAttribute('contenteditable', 'false');
  expect(protectedElement).toHaveAttribute('data-libre-editor-protected', 'true');
});

test('prevents direct input inside protected raw blocks', () => {
  render(
    <HtmlEditor htmlSource='<article><pre data-libre-protected="raw-markdown"># Raw</pre></article>' />
  );

  const editorElement = screen.getByRole('textbox', { name: 'Local HTML editor' });
  const protectedElement = screen.getByText('# Raw');

  const beforeInputEvent = new InputEvent('beforeinput', {
    bubbles: true,
    cancelable: true,
  });

  expect(editorElement).toContainElement(protectedElement);
  expect(fireEvent(protectedElement, beforeInputEvent)).toBe(false);
});
