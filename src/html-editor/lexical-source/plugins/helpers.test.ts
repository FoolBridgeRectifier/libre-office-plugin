import { createEditor } from 'lexical';

import { HtmlElementNode, LockedHtmlNode } from '../html-element/htmlElement';
import { loadHtmlSourceIntoLexicalEditor } from './helpers';

function exportLoadedHtmlSource(htmlSource: string): string {
  const editor = createEditor({
    namespace: 'LibreNoteEditorHtmlSourceTest',
    nodes: [HtmlElementNode, LockedHtmlNode],
    onError: (error) => {
      throw error;
    },
  });

  let exportedHtmlSource = '';

  editor.update(
    () => {
      exportedHtmlSource = loadHtmlSourceIntoLexicalEditor(editor, htmlSource);
    },
    { discrete: true }
  );

  return exportedHtmlSource;
}

test('loads and exports html without lexical-only artifacts', () => {
  const exportedHtmlSource = exportLoadedHtmlSource('<article><h1>Title</h1><p>Body</p></article>');

  expect(exportedHtmlSource).toBe('<article><h1>Title</h1><p>Body</p></article>');
});

test('preserves obsidian metadata attributes during lexical html round trip', () => {
  const exportedHtmlSource = exportLoadedHtmlSource(
    [
      '<article>',
      '<a data-libre-obsidian-link-source="[[Note#Heading|Alias]]">Alias</a>',
      '<span data-libre-attachment-source="![[image.png]]">',
      '<img alt="Image" src="image.png">',
      '</span>',
      '</article>',
    ].join('')
  );

  expect(exportedHtmlSource).toContain('data-libre-obsidian-link-source="[[Note#Heading|Alias]]"');
  expect(exportedHtmlSource).toContain('data-libre-attachment-source="![[image.png]]"');
  expect(exportedHtmlSource).toContain('<img alt="Image" src="image.png">');
  expect(exportedHtmlSource).not.toContain('data-lexical');
});

test('preserves protected raw blocks as read-only html source', () => {
  const exportedHtmlSource = exportLoadedHtmlSource(
    '<article><pre data-libre-protected="raw-markdown"># Raw</pre></article>'
  );

  expect(exportedHtmlSource).toBe(
    '<article><pre data-libre-protected="raw-markdown"># Raw</pre></article>'
  );
});

test('loads protected code fences and complex tables as editable html', () => {
  const exportedHtmlSource = exportLoadedHtmlSource(
    [
      '<article>',
      '<pre data-libre-protected="code-fence"><code>const value = true;</code></pre>',
      '<table data-libre-protected="complex-table"><tr><td>Cell</td></tr></table>',
      '</article>',
    ].join('')
  );

  expect(exportedHtmlSource).toContain('data-libre-protected="code-fence"');
  expect(exportedHtmlSource).toContain('data-libre-protected="complex-table"');
  expect(exportedHtmlSource).not.toContain('data-libre-editor-protected');
  expect(exportedHtmlSource).not.toContain('contenteditable="false"');
});
