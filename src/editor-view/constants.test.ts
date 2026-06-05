import {
  LIBRE_MARKDOWN_VIEW_TYPE,
  MARKDOWN_FILE_EXTENSIONS,
  NATIVE_MARKDOWN_VIEW_TYPE,
} from './constants';
import { createFile } from './utils';
import { createLibreMarkdownViewState, createNativeMarkdownViewState } from './helpers';

test('defines markdown routing constants', () => {
  expect(LIBRE_MARKDOWN_VIEW_TYPE).toBe('libre-note-editor-view');
  expect(NATIVE_MARKDOWN_VIEW_TYPE).toBe('markdown');
  expect(MARKDOWN_FILE_EXTENSIONS).toContain('md');
});

test('creates Libre and native markdown view states for a file path', () => {
  const markdownFile = createFile('Folder/Note.md', 'md');

  expect(createLibreMarkdownViewState(markdownFile, true)).toMatchObject({
    active: true,
    state: { file: 'Folder/Note.md' },
    type: LIBRE_MARKDOWN_VIEW_TYPE,
  });

  expect(createNativeMarkdownViewState(markdownFile, false)).toMatchObject({
    active: false,
    state: { file: 'Folder/Note.md' },
    type: NATIVE_MARKDOWN_VIEW_TYPE,
  });
});
