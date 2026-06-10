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

test('controlled html source updates emit the edited dom position without a leading insertion', () => {
  const emittedHtmlSources: string[] = [];

  function ControlledEditor() {
    const [htmlSource, setHtmlSource] = useState(
      '<article><p>First paragraph</p><p>Last paragraph</p></article>'
    );

    const handleHtmlSourceChange = (nextHtmlSource: string) => {
      emittedHtmlSources.push(nextHtmlSource);
      setHtmlSource(nextHtmlSource);
    };

    return <HtmlEditor htmlSource={htmlSource} onHtmlSourceChange={handleHtmlSourceChange} />;
  }

  render(<ControlledEditor />);

  const editorElement = screen.getByRole('textbox', { name: 'Local HTML editor' });
  const lastParagraphElement = screen.getByText('Last paragraph');

  lastParagraphElement.textContent = 'Last paragraph typed';
  fireEvent.input(editorElement);

  expect(emittedHtmlSources).toContain(
    '<article><p>First paragraph</p><p>Last paragraph typed</p></article>'
  );
  expect(editorElement.textContent?.startsWith('typed')).toBe(false);
});

test('user input emits sanitized html source', () => {
  const handleHtmlSourceChange = jest.fn();

  render(
    <HtmlEditor
      htmlSource="<article><p>Original</p></article>"
      onHtmlSourceChange={handleHtmlSourceChange}
    />
  );

  const editorElement = screen.getByRole('textbox', { name: 'Local HTML editor' });

  editorElement.innerHTML = '<article><p onclick="bad()">Clean</p><script>bad()</script></article>';
  fireEvent.input(editorElement);

  expect(handleHtmlSourceChange).toHaveBeenLastCalledWith('<article><p>Clean</p></article>');
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

test('internal links navigate with preserved Obsidian targets', () => {
  const handleInternalLinkNavigate = jest.fn();

  render(
    <HtmlEditor
      htmlSource='<article><p><a class="internal-link" data-href="Wrong" data-libre-obsidian-link-source="[[Folder/Note#Heading|Alias]]">Alias</a></p></article>'
      onInternalLinkNavigate={handleInternalLinkNavigate}
    />
  );

  fireEvent.click(screen.getByText('Alias'));

  expect(handleInternalLinkNavigate).toHaveBeenCalledWith('Folder/Note#Heading');
});

test('tags navigate with exact preserved tag text', () => {
  const handleTagNavigate = jest.fn();

  render(
    <HtmlEditor
      htmlSource='<article><p><a class="tag" href="#parent/child" data-libre-obsidian-tag-source="#parent/child">Readable tag</a></p></article>'
      onTagNavigate={handleTagNavigate}
    />
  );

  fireEvent.click(screen.getByText('Readable tag'));

  expect(handleTagNavigate).toHaveBeenCalledWith('#parent/child');
});

test('external links open only safe URL schemes', () => {
  const handleExternalLinkNavigate = jest.fn();

  render(
    <HtmlEditor
      htmlSource='<article><p><a href="https://example.com/page">Safe</a> <a href="javascript:alert(1)">Unsafe</a></p></article>'
      onExternalLinkNavigate={handleExternalLinkNavigate}
    />
  );

  fireEvent.click(screen.getByText('Safe'));
  fireEvent.click(screen.getByText('Unsafe'));

  expect(handleExternalLinkNavigate).toHaveBeenCalledTimes(1);
  expect(handleExternalLinkNavigate).toHaveBeenCalledWith('https://example.com/page');
});

test('external links navigate from mouse down without repeating on paired click', async () => {
  const handleExternalLinkNavigate = jest.fn();

  render(
    <HtmlEditor
      htmlSource='<article><p><a href="https://example.com/mouse-down">Mouse down link</a></p></article>'
      onExternalLinkNavigate={handleExternalLinkNavigate}
    />
  );

  const linkElement = screen.getByText('Mouse down link');

  const mouseDownEvent = new MouseEvent('mousedown', {
    bubbles: true,
    cancelable: true,
  });

  expect(fireEvent(linkElement, mouseDownEvent)).toBe(false);

  await new Promise((resolve) => setTimeout(resolve, 20));

  fireEvent.click(linkElement);
  fireEvent.click(linkElement);

  expect(handleExternalLinkNavigate).toHaveBeenCalledTimes(2);
  expect(handleExternalLinkNavigate).toHaveBeenCalledWith('https://example.com/mouse-down');
});

test('external mouse down navigation keeps unsafe and local link targets blocked', () => {
  const handleExternalLinkNavigate = jest.fn();

  render(
    <HtmlEditor
      htmlSource='<article><p><a href="http://example.com">Http</a> <a href="mailto:editor@example.com">Mail</a> <a href="/relative">Relative</a> <a href="javascript:alert(1)">Script</a> <a class="internal-link" data-href="Note" href="https://example.com/internal">Internal</a> <a class="tag" href="#tag">Tag</a></p></article>'
      onExternalLinkNavigate={handleExternalLinkNavigate}
    />
  );

  fireEvent.mouseDown(screen.getByText('Http'));
  fireEvent.mouseDown(screen.getByText('Mail'));
  fireEvent.mouseDown(screen.getByText('Relative'));
  fireEvent.mouseDown(screen.getByText('Script'));

  fireEvent.mouseDown(screen.getByText('Internal'));
  fireEvent.mouseDown(screen.getByText('Tag'));

  expect(handleExternalLinkNavigate).toHaveBeenCalledTimes(2);
  expect(handleExternalLinkNavigate).toHaveBeenNthCalledWith(1, 'http://example.com/');
  expect(handleExternalLinkNavigate).toHaveBeenNthCalledWith(2, 'mailto:editor@example.com');
});

test('repeated external mouse down and click pairs navigate once per link', () => {
  const handleExternalLinkNavigate = jest.fn();
  const linkCount = 75;

  const linkHtml = Array.from(
    { length: linkCount },
    (_, linkIndex) => `<a href="https://example.com/stress-${linkIndex}">Stress ${linkIndex}</a>`
  ).join(' ');

  render(
    <HtmlEditor
      htmlSource={`<article><p>${linkHtml}</p></article>`}
      onExternalLinkNavigate={handleExternalLinkNavigate}
    />
  );

  for (const linkElement of screen.getAllByText(/^Stress \d+$/)) {
    fireEvent.mouseDown(linkElement);
    fireEvent.click(linkElement);
  }

  expect(handleExternalLinkNavigate).toHaveBeenCalledTimes(linkCount);
  expect(handleExternalLinkNavigate).toHaveBeenNthCalledWith(1, 'https://example.com/stress-0');

  expect(handleExternalLinkNavigate).toHaveBeenNthCalledWith(
    linkCount,
    'https://example.com/stress-74'
  );
});

test('links inside protected and code content do not navigate', () => {
  const handleInternalLinkNavigate = jest.fn();
  const handleExternalLinkNavigate = jest.fn();

  render(
    <HtmlEditor
      htmlSource='<article><pre data-libre-protected="raw-markdown"><a class="internal-link" data-href="Protected">Protected</a></pre><p><code><a href="https://example.com">Code link</a></code></p></article>'
      onExternalLinkNavigate={handleExternalLinkNavigate}
      onInternalLinkNavigate={handleInternalLinkNavigate}
    />
  );

  fireEvent.mouseDown(screen.getByText('Protected'));
  fireEvent.mouseDown(screen.getByText('Code link'));
  fireEvent.click(screen.getByText('Protected'));
  fireEvent.click(screen.getByText('Code link'));

  expect(handleInternalLinkNavigate).not.toHaveBeenCalled();
  expect(handleExternalLinkNavigate).not.toHaveBeenCalled();
});

test('footnote references focus matching definitions inside the editor', () => {
  const scrollIntoView = jest.fn();

  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: scrollIntoView,
  });

  render(
    <HtmlEditor htmlSource='<article><p>Body<sup class="footnote-ref"><a href="#fn-1" id="fnref-1">1</a></sup></p><section class="footnotes"><ol><li id="fn-1">Definition <a class="footnote-backref" href="#fnref-1">back</a></li></ol></section></article>' />
  );

  fireEvent.click(screen.getByText('1'));

  expect(document.activeElement).toBe(document.getElementById('fn-1'));
  expect(scrollIntoView).toHaveBeenCalledWith({ block: 'center', inline: 'nearest' });
});

test('heading collapse hides content until the next same-or-higher heading', () => {
  render(
    <HtmlEditor htmlSource="<article><h1>Top</h1><p>Top body</p><h2>Nested</h2><p>Nested body</p><h1>Next</h1><p>Next body</p></article>" />
  );

  const collapseButtons = screen.getAllByRole('button', { name: 'Toggle heading collapse' });

  fireEvent.click(collapseButtons[0] as HTMLButtonElement);

  expect(screen.getByText('Top body').closest('p')).toHaveClass('libre-heading-collapse-hidden');
  expect(screen.getByText('Nested').closest('h2')).toHaveClass('libre-heading-collapse-hidden');
  expect(screen.getByText('Nested body').closest('p')).toHaveClass('libre-heading-collapse-hidden');

  expect(screen.getByText('Next').closest('h1')).not.toHaveClass('libre-heading-collapse-hidden');
  expect(screen.getByText('Next body').closest('p')).not.toHaveClass(
    'libre-heading-collapse-hidden'
  );
});

test('heading collapse follows Obsidian rendered block wrappers', () => {
  render(
    <HtmlEditor htmlSource='<article><div class="el-h2"><h2>Wrapped</h2></div><div class="el-p"><p>Wrapped body</p></div><div class="el-h3"><h3>Wrapped child</h3></div><div class="el-p"><p>Child body</p></div><div class="el-h2"><h2>Wrapped peer</h2></div><div class="el-p"><p>Peer body</p></div></article>' />
  );

  const collapseButton = screen.getAllByRole('button', { name: 'Toggle heading collapse' })[0];

  if (!collapseButton) {
    throw new Error('Expected wrapped heading collapse control.');
  }

  fireEvent.click(collapseButton);

  expect(screen.getByText('Wrapped body').closest('.el-p')).toHaveClass(
    'libre-heading-collapse-hidden'
  );

  expect(screen.getByText('Wrapped child').closest('.el-h3')).toHaveClass(
    'libre-heading-collapse-hidden'
  );

  expect(screen.getByText('Wrapped peer').closest('.el-h2')).not.toHaveClass(
    'libre-heading-collapse-hidden'
  );

  expect(screen.getByText('Peer body').closest('.el-p')).not.toHaveClass(
    'libre-heading-collapse-hidden'
  );
});

test('heading collapse controls are keyboard accessible', () => {
  render(<HtmlEditor htmlSource="<article><h2>Keyboard</h2><p>Keyboard body</p></article>" />);

  const collapseButton = screen.getByRole('button', { name: 'Toggle heading collapse' });

  fireEvent.keyDown(collapseButton, { key: 'Enter' });

  expect(collapseButton).toHaveAttribute('aria-expanded', 'false');
  expect(screen.getByText('Keyboard body').closest('p')).toHaveClass(
    'libre-heading-collapse-hidden'
  );
});

test('navigation and heading collapse interactions do not emit source changes', () => {
  const handleHtmlSourceChange = jest.fn();
  const handleInternalLinkNavigate = jest.fn();

  render(
    <HtmlEditor
      htmlSource='<article><p><a class="internal-link" data-href="Target">Target</a></p><h2>Section</h2><p>Body</p></article>'
      onHtmlSourceChange={handleHtmlSourceChange}
      onInternalLinkNavigate={handleInternalLinkNavigate}
    />
  );

  fireEvent.click(screen.getByText('Target'));
  fireEvent.click(screen.getByRole('button', { name: 'Toggle heading collapse' }));

  expect(handleInternalLinkNavigate).toHaveBeenCalledWith('Target');
  expect(handleHtmlSourceChange).not.toHaveBeenCalled();
});

test('autosave cleanup preserves content while heading content is collapsed', () => {
  const handleHtmlSourceChange = jest.fn();

  render(
    <HtmlEditor
      htmlSource="<article><h2>Section</h2><p>Hidden body</p><h2>Next</h2><p>Visible body</p></article>"
      onHtmlSourceChange={handleHtmlSourceChange}
    />
  );

  const collapseButton = screen.getAllByRole('button', { name: 'Toggle heading collapse' })[0];

  if (!collapseButton) {
    throw new Error('Expected heading collapse control.');
  }

  fireEvent.click(collapseButton);

  fireEvent.input(screen.getByRole('textbox', { name: 'Local HTML editor' }));

  expect(handleHtmlSourceChange).toHaveBeenLastCalledWith(
    '<article><h2>Section</h2><p>Hidden body</p><h2>Next</h2><p>Visible body</p></article>'
  );
});

test('snapshots link, tag, footnote, and heading collapse rendering', () => {
  const { container } = render(
    <HtmlEditor htmlSource='<article><h2>Section</h2><p><a class="internal-link" data-href="Note#Heading" data-libre-obsidian-link-source="[[Note#Heading|Alias]]">Alias</a> <a class="tag" href="#parent/child" data-libre-obsidian-tag-source="#parent/child">#parent/child</a> <sup class="footnote-ref"><a href="#fn-1" id="fnref-1">1</a></sup></p><section class="footnotes"><ol><li id="fn-1">Definition</li></ol></section></article>' />
  );

  expect(screen.getByRole('button', { name: 'Toggle heading collapse' })).toHaveAttribute(
    'aria-expanded',
    'true'
  );

  expect(container).toMatchSnapshot();
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

test('initial html load does not mark the editor dirty', () => {
  const handleDirtyStateChange = jest.fn();

  render(
    <HtmlEditor
      htmlSource="<article><p>Original</p></article>"
      onDirtyStateChange={handleDirtyStateChange}
    />
  );

  expect(handleDirtyStateChange).toHaveBeenCalledWith(false);
  expect(handleDirtyStateChange).not.toHaveBeenCalledWith(true);
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

test('protected raw blocks can be removed and emit sanitized html', () => {
  const handleHtmlSourceChange = jest.fn();

  render(
    <HtmlEditor
      htmlSource='<article><pre data-libre-protected="raw-markdown"># Raw</pre></article>'
      onHtmlSourceChange={handleHtmlSourceChange}
    />
  );

  const editorElement = screen.getByRole('textbox', { name: 'Local HTML editor' });
  const protectedElement = screen.getByText('# Raw');

  protectedElement.remove();
  fireEvent.input(editorElement);

  expect(handleHtmlSourceChange).toHaveBeenLastCalledWith('<article><br></article>');
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
