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

test('shows an unsafe content warning after sanitizing loaded html', () => {
  render(<HtmlEditor htmlSource='<article><p onclick="bad()">Unsafe</p></article>' />);

  expect(screen.getByRole('alert', { name: 'HTML security warning' })).toHaveTextContent(
    'Unsafe HTML was removed before editing.'
  );

  expect(screen.getByRole('textbox', { name: 'Local HTML editor' }).innerHTML).not.toContain(
    'onclick'
  );
});

test('loads html source into the local editor surface', () => {
  render(<HtmlEditor htmlSource="<article><h1>Loaded title</h1><p>Body</p></article>" />);

  expect(screen.getByRole('textbox', { name: 'Local HTML editor' })).toContainHTML(
    '<h1>Loaded title</h1>'
  );
});

test('uses pageless mobile-safe editor classes for wrapping and media containment', () => {
  render(
    <HtmlEditor htmlSource="<article><p>LongUnbrokenWord</p><img alt='Wide' src='wide.png'></article>" />
  );

  const editorElement = screen.getByRole('textbox', { name: 'Local HTML editor' });

  expect(editorElement).toHaveClass('p-0');
  expect(editorElement).toHaveClass('box-border');
  expect(editorElement).toHaveClass('min-w-0');
  expect(editorElement).toHaveClass('max-w-full');

  expect(editorElement.className).toContain('[overflow-wrap:anywhere]');
  expect(editorElement.className).toContain('[&_.libre-contained-editor-media]:max-w-full');
});

test('renders table content inside a horizontal overflow container', () => {
  render(<HtmlEditor htmlSource="<article><table><tr><td>Wide</td></tr></table></article>" />);

  const tableScrollElement = screen.getByText('Wide').closest('.libre-table-scroll');

  if (!tableScrollElement) {
    throw new Error('Expected wide table content to be wrapped for horizontal scrolling.');
  }

  expect(tableScrollElement).toHaveClass('overflow-x-auto');
  expect(tableScrollElement).toHaveClass('max-w-full');
});

test('emits changed html source and dirty state on editor input', () => {
  const handleHtmlSourceChange = jest.fn();
  const handleDirtyStateChange = jest.fn();

  const { rerender } = render(
    <HtmlEditor
      htmlSource="<article><p>Original</p></article>"
      onDirtyStateChange={handleDirtyStateChange}
      onHtmlSourceChange={handleHtmlSourceChange}
    />
  );

  const editorElement = screen.getByRole('textbox', { name: 'Local HTML editor' });

  editorElement.innerHTML = '<article><p>Changed</p></article>';
  fireEvent.input(editorElement);
  const changedParagraphElement = screen.getByText('Changed');

  rerender(
    <HtmlEditor
      htmlSource="<article><p>Changed</p></article>"
      onDirtyStateChange={handleDirtyStateChange}
      onHtmlSourceChange={handleHtmlSourceChange}
    />
  );

  expect(handleHtmlSourceChange).toHaveBeenLastCalledWith('<article><p>Changed</p></article>');
  expect(handleDirtyStateChange).toHaveBeenLastCalledWith(true);
  expect(screen.getByText('Changed')).toBe(changedParagraphElement);
});

test('sanitizes unsafe editor input before emitting it', () => {
  const handleHtmlSourceChange = jest.fn();

  render(
    <HtmlEditor
      htmlSource="<article><p>Original</p></article>"
      onHtmlSourceChange={handleHtmlSourceChange}
    />
  );

  const editorElement = screen.getByRole('textbox', { name: 'Local HTML editor' });

  editorElement.innerHTML =
    '<article><p onmouseover="bad()">Changed</p><script>bad()</script></article>';
  fireEvent.input(editorElement);

  expect(screen.getByRole('alert', { name: 'HTML security warning' })).toHaveTextContent(
    'Unsafe HTML was removed before editing.'
  );

  expect(handleHtmlSourceChange).toHaveBeenLastCalledWith('<article><p>Changed</p></article>');
  expect(editorElement).not.toContainHTML('onmouseover');
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

test('keeps desktop-only protected content visible and guarded', () => {
  render(
    <HtmlEditor htmlSource='<article><section data-libre-protected="desktop-only">Desktop layout</section></article>' />
  );

  const protectedElement = screen.getByText('Desktop layout');

  expect(protectedElement).toBeVisible();
  expect(protectedElement).toHaveClass('libre-protected-html-block');
  expect(protectedElement).toHaveAttribute('contenteditable', 'false');
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

test('snapshots narrow editor rendering without a fixed page canvas', () => {
  const originalInnerWidth = window.innerWidth;

  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 360 });

  try {
    const { container } = render(
      <HtmlEditor htmlSource="<article><p>Narrow body</p><img alt='Wide' src='wide.png'></article>" />
    );

    expect(screen.getByRole('textbox', { name: 'Local HTML editor' })).toHaveClass('w-full');
    expect(container).toMatchSnapshot();
  } finally {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalInnerWidth });
  }
});
