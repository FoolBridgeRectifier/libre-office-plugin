import { createAutosaveController } from './autosave';
import type { AutosaveStatus } from './interfaces';

function createControllerOptions() {
  const autosaveStatuses: AutosaveStatus[] = [];

  return {
    autosaveStatuses,
    onStatusChange: jest.fn((autosaveStatus: AutosaveStatus) => {
      autosaveStatuses.push(autosaveStatus);
    }),
    saveHtmlSource: jest.fn(async () => undefined),
    syncMarkdownMirror: jest.fn(async () => undefined),
  };
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

test('autosaves dirty html after the default interval', async () => {
  const options = createControllerOptions();
  const controller = createAutosaveController(options);

  controller.setActiveDocument({ htmlSource: '<p>Original</p>', markdownPath: 'Note.md' });
  controller.handleHtmlSourceChange('<p>Changed</p>');

  await jest.advanceTimersByTimeAsync(4999);

  expect(options.saveHtmlSource).not.toHaveBeenCalled();

  await jest.advanceTimersByTimeAsync(1);

  expect(options.saveHtmlSource).toHaveBeenCalledWith({
    htmlSource: '<p>Changed</p>',
    markdownPath: 'Note.md',
    previousHtmlSource: '<p>Original</p>',
  });

  expect(options.autosaveStatuses).toEqual(['saved', 'dirty', 'saving', 'saved']);
});

test('syncs markdown after saving html on the markdown interval', async () => {
  const options = createControllerOptions();
  const controller = createAutosaveController(options);

  controller.setActiveDocument({ htmlSource: '<p>Original</p>', markdownPath: 'Note.md' });
  controller.handleHtmlSourceChange('<p>Changed</p>');

  await jest.advanceTimersByTimeAsync(30000);

  expect(options.saveHtmlSource).toHaveBeenCalledTimes(1);

  expect(options.syncMarkdownMirror).toHaveBeenCalledWith({
    htmlSource: '<p>Changed</p>',
    markdownPath: 'Note.md',
  });

  expect(options.autosaveStatuses).toContain('syncing-markdown');
});

test('flushes pending changes immediately for lifecycle events', async () => {
  const options = createControllerOptions();
  const controller = createAutosaveController(options);

  controller.setActiveDocument({ htmlSource: '<p>Original</p>', markdownPath: 'Note.md' });
  controller.handleHtmlSourceChange('<p>Blurred</p>');

  await controller.flushAll();

  expect(options.saveHtmlSource).toHaveBeenCalledTimes(1);
  expect(options.syncMarkdownMirror).toHaveBeenCalledTimes(1);

  expect(options.syncMarkdownMirror).toHaveBeenCalledWith({
    htmlSource: '<p>Blurred</p>',
    markdownPath: 'Note.md',
  });
});

test('retries failed writes after the retry delay', async () => {
  const options = createControllerOptions();

  options.saveHtmlSource.mockRejectedValueOnce(new Error('write failed'));

  const controller = createAutosaveController(options);

  controller.setActiveDocument({ htmlSource: '<p>Original</p>', markdownPath: 'Note.md' });
  controller.handleHtmlSourceChange('<p>Retry</p>');

  await jest.advanceTimersByTimeAsync(5000);

  expect(options.autosaveStatuses).toContain('error');
  expect(options.saveHtmlSource).toHaveBeenCalledTimes(1);

  await jest.advanceTimersByTimeAsync(1000);

  expect(options.saveHtmlSource).toHaveBeenCalledTimes(2);
  expect(options.autosaveStatuses.at(-1)).toBe('saved');
});

test('does not save unchanged content', async () => {
  const options = createControllerOptions();
  const controller = createAutosaveController(options);

  controller.setActiveDocument({ htmlSource: '<p>Same</p>', markdownPath: 'Note.md' });
  controller.handleHtmlSourceChange('<p>Same</p>');

  await jest.advanceTimersByTimeAsync(30000);

  expect(options.saveHtmlSource).not.toHaveBeenCalled();
  expect(options.syncMarkdownMirror).not.toHaveBeenCalled();
});
