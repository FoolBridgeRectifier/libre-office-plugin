import { clearAutosaveTimer, getAutosaveTiming, isAutosaveConflictError } from './helpers';
import type {
  AutosaveController,
  AutosaveControllerOptions,
  AutosaveDocument,
  AutosaveStatus,
} from './interfaces';

export function createAutosaveController(options: AutosaveControllerOptions): AutosaveController {
  const autosaveTiming = getAutosaveTiming(options);

  let activeDocument: AutosaveDocument | null = null;
  let htmlAutosaveTimer: ReturnType<typeof setTimeout> | null = null;
  let markdownSyncTimer: ReturnType<typeof setTimeout> | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  let lastSavedHtmlSource = '';
  let pendingHtmlSource: string | null = null;
  let saveInFlight: Promise<void> | null = null;

  const setStatus = (status: AutosaveStatus) => {
    options.onStatusChange?.(status);
  };

  const clearScheduledWork = () => {
    clearAutosaveTimer(htmlAutosaveTimer);
    clearAutosaveTimer(markdownSyncTimer);
    clearAutosaveTimer(retryTimer);

    htmlAutosaveTimer = null;
    markdownSyncTimer = null;
    retryTimer = null;
  };

  const scheduleRetry = () => {
    clearAutosaveTimer(retryTimer);

    retryTimer = setTimeout(() => {
      retryTimer = null;
      void flushAll();
    }, autosaveTiming.retryDelayMs);
  };

  const scheduleAutosave = () => {
    clearAutosaveTimer(htmlAutosaveTimer);
    clearAutosaveTimer(markdownSyncTimer);

    htmlAutosaveTimer = setTimeout(() => {
      htmlAutosaveTimer = null;
      void flushHtml();
    }, autosaveTiming.htmlAutosaveIntervalMs);

    markdownSyncTimer = setTimeout(() => {
      markdownSyncTimer = null;
      void flushAll();
    }, autosaveTiming.markdownSyncIntervalMs);
  };

  const flushHtml = async () => {
    if (!activeDocument || pendingHtmlSource === null) {
      return;
    }

    if (saveInFlight) {
      await saveInFlight;
      return;
    }

    const htmlSourceToSave = pendingHtmlSource;
    setStatus('saving');

    try {
      saveInFlight = options.saveHtmlSource({
        htmlSource: htmlSourceToSave,
        markdownPath: activeDocument.markdownPath,
        previousHtmlSource: lastSavedHtmlSource,
      });

      await saveInFlight;
      lastSavedHtmlSource = htmlSourceToSave;
      pendingHtmlSource = pendingHtmlSource === htmlSourceToSave ? null : pendingHtmlSource;
      setStatus(pendingHtmlSource === null ? 'saved' : 'dirty');

      if (pendingHtmlSource !== null) {
        scheduleAutosave();
      }
    } catch (error) {
      setStatus(isAutosaveConflictError(error) ? 'conflicted' : 'error');
      scheduleRetry();
    } finally {
      saveInFlight = null;
    }
  };

  const flushAll = async () => {
    await flushHtml();

    if (!activeDocument || pendingHtmlSource !== null) {
      return;
    }

    setStatus('syncing-markdown');

    try {
      await options.syncMarkdownMirror({
        htmlSource: pendingHtmlSource ?? lastSavedHtmlSource,
        markdownPath: activeDocument.markdownPath,
      });

      setStatus(pendingHtmlSource === null ? 'saved' : 'dirty');
    } catch (error) {
      setStatus(isAutosaveConflictError(error) ? 'conflicted' : 'error');
      scheduleRetry();
    }
  };

  return {
    async clearActiveDocument() {
      await flushAll();
      activeDocument = null;
      lastSavedHtmlSource = '';
      pendingHtmlSource = null;

      clearScheduledWork();
      setStatus('saved');
    },
    flushAll,
    flushHtml,
    handleHtmlSourceChange(htmlSource) {
      if (!activeDocument || htmlSource === lastSavedHtmlSource) {
        pendingHtmlSource = null;
        clearScheduledWork();
        setStatus('saved');
        return;
      }

      pendingHtmlSource = htmlSource;
      setStatus('dirty');
      scheduleAutosave();
    },
    setActiveDocument(document) {
      clearScheduledWork();
      activeDocument = document;
      lastSavedHtmlSource = document?.htmlSource ?? '';

      pendingHtmlSource = null;
      setStatus('saved');
    },
  };
}
