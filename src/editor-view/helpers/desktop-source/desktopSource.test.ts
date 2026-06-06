import {
  refreshEditorViewDesktopSourceAfterLoad,
  syncEditorViewDesktopSource,
} from './desktopSource';
import type { EditorViewDesktopSourceTarget } from '../../interfaces';

test('does not sync ODT changes after dirty HTML flush creates a conflict', async () => {
  const target = createDesktopSourceTarget('conflicted');

  await syncEditorViewDesktopSource(target);

  expect(target.autosaveController.flushAll).toHaveBeenCalledTimes(1);
  expect(target.editorViewOptions.syncDesktopSource).not.toHaveBeenCalled();
  expect(target.importedHtmlSource).toBe('<article>Dirty</article>');
});

test('applies synced desktop HTML when flush leaves the editor saved', async () => {
  const target = createDesktopSourceTarget('saved');

  await syncEditorViewDesktopSource(target);

  expect(target.editorViewOptions.syncDesktopSource).toHaveBeenCalledWith(
    target.activeMarkdownFile
  );
  expect(target.importedHtmlSource).toBe('<article>Synced</article>');

  expect(target.autosaveController.setActiveDocument).toHaveBeenCalledWith({
    htmlSource: '<article>Synced</article>',
    markdownPath: 'Note.md',
  });

  expect(target.renderReactApp).toHaveBeenCalledTimes(1);
});

test('skips desktop source refresh when HTML fallback mode is active', async () => {
  const target = createDesktopSourceTarget('saved');
  target.activeEditorSource = 'html-fallback';

  await refreshEditorViewDesktopSourceAfterLoad(target, target.activeMarkdownFile!);

  expect(target.editorViewOptions.syncDesktopSource).not.toHaveBeenCalled();
  expect(target.desktopSourceStatus).toBe('idle');
});

test('shows an error status when desktop refresh fails for the active note', async () => {
  const target = createDesktopSourceTarget('saved');

  target.editorViewOptions.syncDesktopSource = jest.fn(async () => {
    throw new Error('conversion failed');
  });

  await refreshEditorViewDesktopSourceAfterLoad(target, target.activeMarkdownFile!);

  expect(target.autosaveStatus).toBe('error');
  expect(target.desktopSourceStatus).toBe('error');
  expect(target.renderReactApp).toHaveBeenCalledTimes(2);
});

test('does not apply refreshed ODT HTML after the editor becomes dirty', async () => {
  const target = createDesktopSourceTarget('saved');

  target.autosaveStatus = 'saved';

  target.editorViewOptions.syncDesktopSource = jest.fn(async () => {
    target.autosaveStatus = 'dirty';

    return '<article>External ODT</article>';
  });

  await refreshEditorViewDesktopSourceAfterLoad(target, target.activeMarkdownFile!);

  expect(target.importedHtmlSource).toBe('<article>Dirty</article>');
  expect(target.autosaveController.setActiveDocument).not.toHaveBeenCalled();
  expect(target.desktopSourceStatus).toBe('idle');
});

function createDesktopSourceTarget(
  statusAfterFlush: EditorViewDesktopSourceTarget['autosaveStatus']
): EditorViewDesktopSourceTarget {
  const target = {
    activeMarkdownFile: { path: 'Note.md' },
    activeEditorSource: 'desktop-odt',
    autosaveController: {
      clearActiveDocument: jest.fn(),
      flushAll: jest.fn(async () => {
        target.autosaveStatus = statusAfterFlush;
      }),
      flushHtml: jest.fn(),
      handleHtmlSourceChange: jest.fn(),
      setActiveDocument: jest.fn(),
    },
    autosaveStatus: 'dirty',
    desktopSourceStatus: 'idle',
    editorViewOptions: {
      getLinkWarnings: jest.fn(() => []),
      loadImportedHtmlSource: jest.fn(),
      resolveConflict: jest.fn(),
      saveHtmlSource: jest.fn(),
      syncDesktopSource: jest.fn(async () => '<article>Synced</article>'),
      syncMarkdownMirror: jest.fn(),
    },
    importedHtmlSource: '<article>Dirty</article>',
    linkWarningCount: 0,
    renderReactApp: jest.fn(),
  } as unknown as EditorViewDesktopSourceTarget;

  return target;
}
