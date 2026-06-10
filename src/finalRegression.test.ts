import { createSourceStates, resolveRichDocumentConflict } from './conflicts';
import { ensureFirstMarkdownImport } from './markdown-sync/markdownSync';
import { createRichDocumentMapping, createRichDocumentStore } from './rich-documents';
import { RICH_DOCUMENTS_ROOT_PATH } from './rich-documents/constants';
import { createPersistenceTarget } from './rich-documents/utils';
import { saveRichDocumentHtml, syncMarkdownMirror } from './richDocumentWorkspace';
import {
  createMarkdownFile,
  createMarkdownRenderer,
  createMarkdownSyncStore,
  createVaultAdapter,
  createVaultReader,
} from './markdownSyncTestHelpers';

const ACCEPTANCE_HTML_SOURCE = [
  '<article>',
  '<h1>Acceptance</h1>',
  '<p><a data-libre-obsidian-link-source="[[Linked Note|linked]]">linked</a> ',
  '<a class="tag" href="#project/final">#project/final</a></p>',
  '<div class="callout" data-callout="todo" data-callout-fold="+">',
  '<div class="callout-title"><div class="callout-title-inner">Tasks</div></div>',
  '<div class="callout-content"><ul>',
  '<li class="task-list-item" data-task="x">',
  '<input checked class="task-list-item-checkbox" type="checkbox">Done</li>',
  '</ul></div></div>',
  '<pre><code data-libre-structured-markdown-type="code-fence">const answer = 42;</code></pre>',
  '<table><thead><tr><th>Name</th></tr></thead><tbody><tr><td>Value</td></tr></tbody></table>',
  '<img alt="Local image" data-libre-attachment-source="![Local image](Attachments/image.png)" src="Attachments/image.png">',
  '<pre data-libre-protected="raw-markdown">%% preserved raw %%</pre>',
  '</article>',
].join('');

test('final acceptance keeps first import save and markdown mirror on the html lexical path', async () => {
  const mapping = createRichDocumentMapping(
    'Acceptance.md',
    'rich-acceptance',
    '2026-06-10',
    'desktop'
  );

  const richDocumentStore = createMarkdownSyncStore(mapping);

  const vault = createVaultAdapter(
    new Map([['Acceptance.md', '---\ntags: [acceptance]\n---\n\n# Acceptance']])
  );

  const importResult = await ensureFirstMarkdownImport({
    getCurrentTimestamp: () => '2026-06-10T12:00:00.000Z',
    mapping,
    markdownFile: createMarkdownFile('Acceptance.md'),
    markdownRenderer: createMarkdownRenderer(
      `<div class="markdown-preview-section">${ACCEPTANCE_HTML_SOURCE}</div>`
    ),
    richDocumentStore,
    vaultAdapter: vault.adapter,
    vaultReader: createVaultReader(vault.files.get('Acceptance.md') ?? ''),
  });

  expect(importResult.imported).toBe(true);
  expect(vault.files.get(mapping.htmlPath)).toContain('data-libre-protected="raw-markdown"');

  await saveRichDocumentHtml({
    htmlSource: `${ACCEPTANCE_HTML_SOURCE}<script>bad()</script>`,
    markdownPath: mapping.markdownPath,
    previousHtmlSource: importResult.htmlSource,
    richDocumentStore,
    vaultAdapter: vault.adapter,
  });

  await syncMarkdownMirror({
    htmlSource: vault.files.get(mapping.htmlPath) ?? '',
    markdownPath: mapping.markdownPath,
    richDocumentStore,
    vaultAdapter: vault.adapter,
  });

  const savedHtmlSource = vault.files.get(mapping.htmlPath) ?? '';
  const markdownMirrorSource = vault.files.get(mapping.markdownPath) ?? '';

  expect(savedHtmlSource).not.toContain('<script');
  expect(markdownMirrorSource).toContain('[[Linked Note|linked]] #project/final');
  expect(markdownMirrorSource).toContain('> [!todo]+ Tasks');
  expect(markdownMirrorSource).toContain('- [x] Done');

  expect(markdownMirrorSource).toContain('const answer = 42;');
  expect(markdownMirrorSource).toContain('| Name |');
  expect(markdownMirrorSource).toContain('![Local image](Attachments/image.png)');
  expect(markdownMirrorSource).toContain('%% preserved raw %%');
});

test('final acceptance loads existing html without rewriting the richer source', async () => {
  const mapping = createRichDocumentMapping(
    'Existing.md',
    'rich-existing',
    '2026-06-10',
    'desktop'
  );

  const richDocumentStore = createMarkdownSyncStore(mapping);
  const vault = createVaultAdapter(new Map([[mapping.htmlPath, ACCEPTANCE_HTML_SOURCE]]));

  const importResult = await ensureFirstMarkdownImport({
    mapping,
    markdownFile: createMarkdownFile('Existing.md'),
    markdownRenderer: createMarkdownRenderer('<p>Replacement markdown</p>'),
    richDocumentStore,
    vaultAdapter: vault.adapter,
    vaultReader: createVaultReader('# Replacement markdown'),
  });

  expect(importResult.imported).toBe(false);
  expect(importResult.htmlSource).toContain('<h1>Acceptance</h1>');

  expect(importResult.htmlSource).toContain(
    'data-libre-attachment-source="![Local image](Attachments/image.png)"'
  );

  expect(vault.adapter.write).not.toHaveBeenCalled();
});

test('final acceptance resolves html markdown conflicts without odt choices', async () => {
  const baseMapping = createRichDocumentMapping(
    'Conflict.md',
    'rich-conflict',
    '2026-06-10',
    'desktop'
  );

  const vault = createVaultAdapter(
    new Map([
      ['Conflict.md', 'Original markdown'],
      [baseMapping.htmlPath, '<article><p>Original HTML</p></article>'],
    ])
  );

  const trackedMapping = {
    ...baseMapping,
    sourceStates: await createSourceStates(baseMapping, vault.adapter),
  };

  const richDocumentStore = createMarkdownSyncStore(trackedMapping);

  vault.files.set('Conflict.md', 'External markdown');

  await expect(
    saveRichDocumentHtml({
      htmlSource: '<article><p>Local HTML</p></article>',
      markdownPath: trackedMapping.markdownPath,
      previousHtmlSource: '<article><p>Original HTML</p></article>',
      richDocumentStore,
      vaultAdapter: vault.adapter,
    })
  ).rejects.toThrow('Libre Note Editor conflict detected.');

  const conflictedMapping = await richDocumentStore.getOrCreateMapping('Conflict.md');
  expect(conflictedMapping.conflictState.status).toBe('conflicted');

  if (conflictedMapping.conflictState.status !== 'conflicted') {
    throw new Error('Expected conflicted mapping.');
  }

  const htmlCopy = conflictedMapping.conflictState.conflictCopies.find(
    (conflictCopy) => conflictCopy.source === 'html'
  );

  if (!htmlCopy) {
    throw new Error('Expected html conflict copy.');
  }

  const resolvedHtmlSource = await resolveRichDocumentConflict({
    choice: 'html',
    getCurrentTimestamp: () => '2026-06-10T12:00:00.000Z',
    markdownPath: trackedMapping.markdownPath,
    richDocumentStore,
    vaultAdapter: vault.adapter,
  });

  const resolvedMapping = await richDocumentStore.getOrCreateMapping('Conflict.md');

  expect(resolvedHtmlSource).toBe(vault.files.get(htmlCopy.path));
  expect(resolvedMapping.conflictState.status).toBe('none');

  expect(
    conflictedMapping.conflictState.conflictCopies.map((conflictCopy) => conflictCopy.source)
  ).toEqual(expect.arrayContaining(['html', 'markdown']));
});

test('final acceptance normalizes old odt-bearing mappings to html-only state', async () => {
  const legacyPluginData = {
    mappings: [
      {
        activeSource: 'odt',
        htmlPath: `${RICH_DOCUMENTS_ROOT_PATH}/rich-legacy/document.html`,
        markdownPath: 'Legacy.md',
        odtPath: `${RICH_DOCUMENTS_ROOT_PATH}/rich-legacy/document.odt`,
        richDocumentId: 'rich-legacy',
        sourceStates: {
          html: { contentHash: 'html', exists: true, modifiedTime: 1 },
          markdown: { contentHash: 'markdown', exists: true, modifiedTime: 1 },
          odt: { contentHash: 'odt', exists: true, modifiedTime: 1 },
        },
        syncTimestamps: {
          htmlSyncedAt: '2026-06-10T12:00:00.000Z',
          markdownSyncedAt: '2026-06-10T12:00:00.000Z',
          odtSyncedAt: '2026-06-10T12:00:00.000Z',
        },
      },
    ],
  };

  const persistence = createPersistenceTarget(legacyPluginData);
  const vault = createVaultAdapter();

  const richDocumentStore = createRichDocumentStore({
    persistenceTarget: persistence.target,
    vaultAdapter: vault.adapter,
  });

  const mapping = (await richDocumentStore.loadMappings())[0];

  expect(mapping?.activeSource).toBe('html');

  expect(mapping?.sourceStates).toEqual({
    html: { contentHash: 'html', exists: true, modifiedTime: 1 },
    markdown: { contentHash: 'markdown', exists: true, modifiedTime: 1 },
  });

  expect(Object.keys(mapping ?? {})).not.toContain('odtPath');
});
