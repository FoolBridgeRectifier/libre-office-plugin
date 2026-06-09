import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { TASK_CHECKBOX_COLOR_PROPERTY } from './constants';
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
  expect(screen.getByLabelText('Blank HTML editor')).toHaveClass('box-border');
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

  const headingElement = screen.getByText('Loaded title').closest('h1');

  expect(headingElement).not.toBeNull();
  expect(screen.getByRole('textbox', { name: 'Local HTML editor' })).toHaveTextContent('Body');
});

test('uses pageless mobile-safe editor classes for wrapping and media containment', () => {
  render(
    <HtmlEditor htmlSource="<article><p>LongUnbrokenWord</p><img alt='Wide' src='wide.png'></article>" />
  );

  const editorElement = screen.getByRole('textbox', { name: 'Local HTML editor' });

  expect(editorElement).toHaveClass('p-0');
  expect(editorElement).toHaveClass('m-2');
  expect(editorElement).toHaveClass('box-border');
  expect(editorElement).toHaveClass('min-w-0');

  expect(editorElement).toHaveClass('max-w-full');
  expect(editorElement).toHaveClass('bg-editor-bg');
  expect(editorElement).toHaveClass('text-editor-text');
  expect(editorElement).not.toHaveClass('border');

  expect(editorElement.className).toContain('[caret-color:var(--editor-caret)]');
  expect(editorElement.className).toContain('[overflow-wrap:anywhere]');
  expect(editorElement.className).toContain('[&_.libre-contained-editor-media]:max-w-full');
});

test('scopes markdown text styling utilities to the local editor surface', () => {
  render(
    <HtmlEditor htmlSource="<article><h1>Title</h1><p><mark>Marked</mark> <code>inline</code></p><blockquote><p>Quote</p></blockquote><pre><code>long code line</code></pre><table><tr><th>Head</th></tr><tr><td>Cell</td></tr></table><hr></article>" />
  );

  const editorElement = screen.getByRole('textbox', { name: 'Local HTML editor' });

  expect(editorElement).toHaveClass('libre-markdown-text-surface');
  expect(editorElement.className).toContain('[&_h1]:text-editor-text');
  expect(editorElement.className).toContain('[&_code]:text-editor-code-text');
  expect(editorElement.className).toContain('[&_pre]:bg-editor-code-bg');

  expect(editorElement.className).toContain('[&_blockquote]:border-editor-quote-border');
  expect(editorElement.className).toContain('[&_mark]:bg-editor-mark-bg');
  expect(editorElement.className).toContain('[&_th]:bg-editor-table-header-bg');

  expect(screen.getByText('Cell').closest('.libre-table-scroll')).toHaveClass('overflow-x-auto');
});

test('keeps editor tokens computable for theme-sensitive styles', () => {
  document.documentElement.style.setProperty('--editor-caret', '#1f1f1f');
  document.documentElement.style.setProperty('--editor-bg', '#ffffff');
  document.documentElement.style.setProperty('--editor-text', '#201f1e');

  render(<HtmlEditor htmlSource="<article><p>Token body</p></article>" />);

  const editorElement = screen.getByRole('textbox', { name: 'Local HTML editor' });
  const rootStyles = getComputedStyle(document.documentElement);

  expect(rootStyles.getPropertyValue('--editor-caret')).toBe('#1f1f1f');
  expect(rootStyles.getPropertyValue('--editor-bg')).toBe('#ffffff');
  expect(editorElement).toHaveClass('bg-editor-bg');
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

test('preserves checked and unchecked task checkbox markup', () => {
  render(
    <HtmlEditor htmlSource='<article><ul><li class="task-list-item" data-task=" "><input class="task-list-item-checkbox" type="checkbox">Todo</li><li class="task-list-item" data-task="x"><input checked class="task-list-item-checkbox" type="checkbox">Done</li></ul></article>' />
  );

  const checkboxElements = document.querySelectorAll<HTMLInputElement>('.task-list-item-checkbox');
  const taskListItemElements = document.querySelectorAll('.task-list-item');

  expect(checkboxElements).toHaveLength(2);
  expect(taskListItemElements).toHaveLength(2);
  expect(checkboxElements[0]?.checked).toBe(false);
  expect(checkboxElements[1]?.checked).toBe(true);
});

test('checkbox toggles update checked state and task metadata', () => {
  const handleHtmlSourceChange = jest.fn();

  render(
    <HtmlEditor
      htmlSource='<article><ul><li class="task-list-item" data-task=" "><input class="task-list-item-checkbox" type="checkbox">Todo</li></ul></article>'
      onHtmlSourceChange={handleHtmlSourceChange}
    />
  );

  const checkboxElement = document.querySelector<HTMLInputElement>('.task-list-item-checkbox');

  if (!checkboxElement) {
    throw new Error('Expected rendered task checkbox.');
  }

  const mouseDownEvent = new MouseEvent('mousedown', {
    bubbles: true,
    cancelable: true,
  });

  expect(fireEvent(checkboxElement, mouseDownEvent)).toBe(false);

  fireEvent.click(checkboxElement);

  expect(checkboxElement.checked).toBe(true);
  expect(checkboxElement).toHaveAttribute('checked', '');
  expect(checkboxElement.closest('li')).toHaveAttribute('data-task', 'x');
  expect(handleHtmlSourceChange).toHaveBeenLastCalledWith(expect.stringContaining('data-task="x"'));
});

test('keyboard activation toggles checkbox state and emits changed html', () => {
  const handleHtmlSourceChange = jest.fn();

  render(
    <HtmlEditor
      htmlSource='<article><ul><li class="task-list-item" data-task=" "><input class="task-list-item-checkbox" type="checkbox">Todo</li></ul></article>'
      onHtmlSourceChange={handleHtmlSourceChange}
    />
  );

  const checkboxElement = document.querySelector<HTMLInputElement>('.task-list-item-checkbox');

  if (!checkboxElement) {
    throw new Error('Expected rendered task checkbox.');
  }

  expect(fireEvent.keyDown(checkboxElement, { key: ' ' })).toBe(false);
  expect(checkboxElement.checked).toBe(true);
  expect(checkboxElement.closest('li')).toHaveAttribute('data-task', 'x');
  expect(handleHtmlSourceChange).toHaveBeenLastCalledWith(expect.stringContaining('checked=""'));
});

test('multiple checkbox activations emit the latest task state before autosave', () => {
  const handleHtmlSourceChange = jest.fn();

  render(
    <HtmlEditor
      htmlSource='<article><ul><li class="task-list-item" data-task=" "><input class="task-list-item-checkbox" type="checkbox">Todo</li></ul></article>'
      onHtmlSourceChange={handleHtmlSourceChange}
    />
  );

  const checkboxElement = document.querySelector<HTMLInputElement>('.task-list-item-checkbox');

  if (!checkboxElement) {
    throw new Error('Expected rendered task checkbox.');
  }

  fireEvent.click(checkboxElement);
  fireEvent.keyDown(checkboxElement, { key: 'Enter' });

  expect(checkboxElement.checked).toBe(false);
  expect(checkboxElement.closest('li')).toHaveAttribute('data-task', ' ');
  expect(handleHtmlSourceChange).toHaveBeenLastCalledWith(expect.stringContaining('data-task=" "'));
});

test('undo and redo shortcuts do not corrupt a toggled task state', () => {
  const handleHtmlSourceChange = jest.fn();

  render(
    <HtmlEditor
      htmlSource='<article><ul><li class="task-list-item" data-task=" "><input class="task-list-item-checkbox" type="checkbox">Todo</li></ul></article>'
      onHtmlSourceChange={handleHtmlSourceChange}
    />
  );

  const editorElement = screen.getByRole('textbox', { name: 'Local HTML editor' });
  const checkboxElement = document.querySelector<HTMLInputElement>('.task-list-item-checkbox');

  if (!checkboxElement) {
    throw new Error('Expected rendered task checkbox.');
  }

  fireEvent.click(checkboxElement);
  fireEvent.keyDown(editorElement, { ctrlKey: true, key: 'z' });
  fireEvent.keyDown(editorElement, { ctrlKey: true, key: 'y' });

  expect(checkboxElement.checked).toBe(true);
  expect(checkboxElement.closest('li')).toHaveAttribute('data-task', 'x');
  expect(handleHtmlSourceChange).toHaveBeenLastCalledWith(expect.stringContaining('data-task="x"'));
});

test('checkboxes inside protected raw content do not toggle or emit changes', () => {
  const handleHtmlSourceChange = jest.fn();

  render(
    <HtmlEditor
      htmlSource='<article><pre data-libre-protected="raw-markdown"><input class="task-list-item-checkbox" type="checkbox">Protected</pre></article>'
      onHtmlSourceChange={handleHtmlSourceChange}
    />
  );

  const checkboxElement = document.querySelector<HTMLInputElement>('.task-list-item-checkbox');

  if (!checkboxElement) {
    throw new Error('Expected protected task checkbox.');
  }

  fireEvent.click(checkboxElement);
  fireEvent.keyDown(checkboxElement, { key: ' ' });

  expect(checkboxElement.checked).toBe(false);
  expect(handleHtmlSourceChange).not.toHaveBeenCalled();
});

test('input edits emit from the edited dom position without a leading insertion', () => {
  const handleHtmlSourceChange = jest.fn();

  render(
    <HtmlEditor
      htmlSource="<article><p>First paragraph</p><p>Last paragraph</p></article>"
      onHtmlSourceChange={handleHtmlSourceChange}
    />
  );

  const editorElement = screen.getByRole('textbox', { name: 'Local HTML editor' });
  const lastParagraphElement = screen.getByText('Last paragraph');

  lastParagraphElement.textContent = 'Last paragraph typed';
  fireEvent.input(editorElement);

  expect(handleHtmlSourceChange).toHaveBeenLastCalledWith(
    '<article><p>First paragraph</p><p>Last paragraph typed</p></article>'
  );
});

test('controlled html source updates do not reload self-emitted editor input', () => {
  function ControlledEditor() {
    const [htmlSource, setHtmlSource] = useState(
      '<article><p>First paragraph</p><p>Last paragraph</p></article>'
    );

    return <HtmlEditor htmlSource={htmlSource} onHtmlSourceChange={setHtmlSource} />;
  }

  render(<ControlledEditor />);

  const editorElement = screen.getByRole('textbox', { name: 'Local HTML editor' });
  const lastParagraphElement = screen.getByText('Last paragraph');

  lastParagraphElement.textContent = 'Last paragraph typed';
  fireEvent.input(editorElement);

  expect(screen.getByText('Last paragraph typed')).toBeVisible();
  expect(editorElement.textContent?.startsWith('typed')).toBe(false);
});

test('checkbox color follows changed task text color while defaulting through css', () => {
  render(
    <HtmlEditor htmlSource='<article><ul><li class="task-list-item" data-task="x" style="color: rgb(180, 40, 120); font-size: 28px;"><input checked class="task-list-item-checkbox" type="checkbox">Colored task</li></ul></article>' />
  );

  const checkboxElement = document.querySelector<HTMLInputElement>('.task-list-item-checkbox');

  if (!checkboxElement) {
    throw new Error('Expected rendered task checkbox.');
  }

  expect(checkboxElement.style.getPropertyValue(TASK_CHECKBOX_COLOR_PROPERTY)).toBe(
    'rgb(180, 40, 120)'
  );
});

test('checked checkbox toggles back to an unchecked task item', () => {
  const handleHtmlSourceChange = jest.fn();

  render(
    <HtmlEditor
      htmlSource='<article><ul><li class="task-list-item" data-task="x"><input checked class="task-list-item-checkbox" type="checkbox">Done</li></ul></article>'
      onHtmlSourceChange={handleHtmlSourceChange}
    />
  );

  const checkboxElement = document.querySelector<HTMLInputElement>('.task-list-item-checkbox');

  if (!checkboxElement) {
    throw new Error('Expected rendered task checkbox.');
  }

  fireEvent.click(checkboxElement);

  expect(checkboxElement.checked).toBe(false);
  expect(checkboxElement).not.toHaveAttribute('checked');
  expect(checkboxElement.closest('li')).toHaveAttribute('data-task', ' ');
  expect(handleHtmlSourceChange).toHaveBeenLastCalledWith(expect.stringContaining('data-task=" "'));
});

test('renders callout pseudo-icon hooks while preserving legacy icon markup', () => {
  render(
    <HtmlEditor htmlSource='<article><div class="callout" data-callout="note"><div class="callout-title"><div class="callout-icon">icon</div><div class="callout-title-inner">Note</div></div><div class="callout-content"><p>Body</p></div></div></article>' />
  );

  const calloutTitleElement = screen.getByText('Note').closest('.callout-title');
  const legacyIconElement = document.querySelector('.callout-icon');

  expect(calloutTitleElement).toHaveAttribute('data-libre-editor-callout-icon', 'true');
  expect(legacyIconElement).toHaveTextContent('icon');
});

test('clicking callout fold control updates state and emitted html', () => {
  const handleHtmlSourceChange = jest.fn();

  render(
    <HtmlEditor
      htmlSource='<article><div class="callout" data-callout="warning" data-callout-fold="+"><div class="callout-title"><div class="callout-icon">icon</div><div class="callout-title-inner">Careful</div></div><div class="callout-content"><p>Body</p></div></div></article>'
      onHtmlSourceChange={handleHtmlSourceChange}
    />
  );

  const foldControlElement = screen.getByRole('button', { name: 'Toggle callout fold' });
  const calloutElement = screen.getByText('Careful').closest('.callout');
  const titleInnerElement = screen.getByText('Careful').closest('.callout-title-inner');

  fireEvent.click(foldControlElement);

  expect(foldControlElement.previousElementSibling).toBe(titleInnerElement);
  expect(foldControlElement.querySelector('.libre-callout-fold-icon-collapsed')).not.toBeNull();
  expect(foldControlElement.querySelector('.libre-callout-fold-icon-expanded')).not.toBeNull();

  expect(calloutElement).toHaveAttribute('data-callout-fold', '-');
  expect(calloutElement).toHaveClass('is-collapsed');
  expect(calloutElement).toHaveAttribute('data-libre-callout-folded');
  expect(foldControlElement).toHaveAttribute('aria-expanded', 'false');

  expect(handleHtmlSourceChange).toHaveBeenLastCalledWith(
    expect.stringContaining('data-callout-fold="-"')
  );

  expect(handleHtmlSourceChange).toHaveBeenLastCalledWith(
    expect.not.stringContaining('data-libre-editor-callout-fold-control')
  );
});

test('keyboard activation toggles callout folding', () => {
  const handleHtmlSourceChange = jest.fn();

  render(
    <HtmlEditor
      htmlSource='<article><div class="callout" data-callout="tip" data-callout-fold="-"><div class="callout-title"><div class="callout-title-inner">Hint</div></div><div class="callout-content"><p>Hidden</p></div></div></article>'
      onHtmlSourceChange={handleHtmlSourceChange}
    />
  );

  const foldControlElement = screen.getByRole('button', { name: 'Toggle callout fold' });
  const calloutElement = screen.getByText('Hint').closest('.callout');
  const titleInnerElement = screen.getByText('Hint').closest('.callout-title-inner');

  fireEvent.keyDown(foldControlElement, { key: 'Enter' });

  expect(foldControlElement.previousElementSibling).toBe(titleInnerElement);

  expect(calloutElement).toHaveAttribute('data-callout-fold', '+');
  expect(calloutElement).not.toHaveClass('is-collapsed');
  expect(calloutElement).not.toHaveAttribute('data-libre-callout-folded');
  expect(foldControlElement).toHaveAttribute('aria-expanded', 'true');

  expect(handleHtmlSourceChange).toHaveBeenLastCalledWith(
    expect.stringContaining('data-callout-fold="+"')
  );
});

test('nested callouts fold independently', () => {
  render(
    <HtmlEditor htmlSource='<article><div class="callout" data-callout="note" data-callout-fold="+"><div class="callout-title"><div class="callout-title-inner">Outer</div></div><div class="callout-content"><div class="callout" data-callout="note" data-callout-fold="+"><div class="callout-title"><div class="callout-title-inner">Inner</div></div><div class="callout-content"><p>Nested body</p></div></div></div></div></article>' />
  );

  const foldControlElements = screen.getAllByRole('button', { name: 'Toggle callout fold' });
  const outerCalloutElement = screen.getByText('Outer').closest('.callout');
  const innerCalloutElement = screen.getByText('Inner').closest('.callout');

  fireEvent.click(foldControlElements[1] as HTMLButtonElement);

  expect(outerCalloutElement).toHaveAttribute('data-callout-fold', '+');
  expect(innerCalloutElement).toHaveAttribute('data-callout-fold', '-');
});

test('snapshots callout rendering with known custom and dark-compatible states', () => {
  document.body.classList.add('theme-dark');

  try {
    const { container } = render(
      <HtmlEditor htmlSource='<article><div class="callout" data-callout="success" data-callout-fold="+"><div class="callout-title"><div class="callout-title-inner">Done</div></div><div class="callout-content"><p>Body</p></div></div><div class="callout" data-callout="custom-kind" data-callout-fold="-"><div class="callout-title"><div class="callout-title-inner"></div></div><div class="callout-content"><p>Custom body</p></div></div></article>' />
    );

    expect(document.querySelector('.callout[data-callout="custom-kind"]')).toHaveAttribute(
      'data-callout-fold',
      '-'
    );

    expect(container).toMatchSnapshot();
  } finally {
    document.body.classList.remove('theme-dark');
  }
});

test('snapshots dark-mode compatible editor rendering', () => {
  document.body.classList.add('theme-dark');

  try {
    const { container } = render(<HtmlEditor htmlSource="<article><p>Dark body</p></article>" />);

    expect(screen.getByRole('textbox', { name: 'Local HTML editor' })).toHaveClass(
      'text-editor-text'
    );
    expect(container).toMatchSnapshot();
  } finally {
    document.body.classList.remove('theme-dark');
  }
});

test('resets dirty state when changed html source is loaded', () => {
  const handleDirtyStateChange = jest.fn();

  const { rerender } = render(
    <HtmlEditor
      htmlSource="<article><p>Original</p></article>"
      onDirtyStateChange={handleDirtyStateChange}
    />
  );

  rerender(
    <HtmlEditor
      htmlSource="<article><p>Changed</p></article>"
      onDirtyStateChange={handleDirtyStateChange}
    />
  );

  expect(screen.getByText('Changed')).toBeVisible();
  expect(handleDirtyStateChange).toHaveBeenLastCalledWith(false);
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

test('allows delete input events inside protected raw blocks', () => {
  render(
    <HtmlEditor htmlSource='<article><pre data-libre-protected="raw-markdown"># Raw</pre></article>' />
  );

  const protectedElement = screen.getByText('# Raw');

  const deleteEvent = new InputEvent('beforeinput', {
    bubbles: true,
    cancelable: true,
    inputType: 'deleteContentBackward',
  });

  expect(fireEvent(protectedElement, deleteEvent)).toBe(true);
});

test('keeps protected code fences and complex tables editable', () => {
  render(
    <HtmlEditor htmlSource='<article><pre data-libre-protected="code-fence"><code>const value = true;</code></pre><table data-libre-protected="complex-table"><tr><td>Cell</td></tr></table></article>' />
  );

  const codeFenceElement = screen.getByText('const value = true;').closest('pre');
  const tableElement = screen.getByText('Cell').closest('table');

  expect(codeFenceElement).not.toHaveAttribute('contenteditable', 'false');
  expect(codeFenceElement).not.toHaveAttribute('data-libre-editor-protected');
  expect(tableElement).not.toHaveAttribute('contenteditable', 'false');
  expect(tableElement).not.toHaveAttribute('data-libre-editor-protected');
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

test('snapshots mixed markdown text constructs in the editor', () => {
  const { container } = render(
    <HtmlEditor htmlSource="<article><h1>Heading</h1><p>Text <strong>bold</strong> <em>italic</em> <del>gone</del> <mark>highlight</mark> <code>inline</code></p><blockquote><p>Quoted text</p></blockquote><ol><li>First<ul><li>Nested</li></ul></li></ol><pre data-libre-protected='raw-markdown'>%% raw %%</pre><table><tr><th>Name</th></tr><tr><td>Alpha</td></tr></table><hr></article>" />
  );

  expect(screen.getByRole('textbox', { name: 'Local HTML editor' })).toHaveTextContent(
    'Quoted text'
  );
  expect(container).toMatchSnapshot();
});

test('snapshots task list rendering with nested and mixed items', () => {
  const { container } = render(
    <HtmlEditor htmlSource='<article><ul><li class="task-list-item" data-task=" "><input class="task-list-item-checkbox" type="checkbox">Todo</li><li class="task-list-item" data-task="x"><input checked class="task-list-item-checkbox" type="checkbox">Done<ul><li class="task-list-item" data-task=" "><input class="task-list-item-checkbox" type="checkbox">Nested</li></ul></li><li>Plain item</li></ul></article>' />
  );

  expect(document.querySelectorAll('.task-list-item-checkbox')).toHaveLength(3);
  expect(container).toMatchSnapshot();
});
