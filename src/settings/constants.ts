export const DEFAULT_AUTOSAVE_INTERVAL_SECONDS = 5;
export const DEFAULT_MARKDOWN_SYNC_INTERVAL_SECONDS = 30;
export const MAX_INTERVAL_SECONDS = 3600;
export const MIN_INTERVAL_SECONDS = 1;

export const DEFAULT_LIBRE_NOTE_EDITOR_SETTINGS = {
  autosaveIntervalSeconds: DEFAULT_AUTOSAVE_INTERVAL_SECONDS,
  conflictBehavior: 'manual',
  editorMode: 'automatic',
  libreOfficePath: '',
  markdownSyncIntervalSeconds: DEFAULT_MARKDOWN_SYNC_INTERVAL_SECONDS,
  pageLayout: 'pageless',
  showMarkdownSourceFallback: true,
} as const;

export const CONFLICT_BEHAVIOR_OPTIONS = [
  { label: 'Manual resolution', value: 'manual' },
  { label: 'Keep rich HTML', value: 'keep-html' },
  { label: 'Keep markdown mirror', value: 'keep-markdown' },
] as const;

export const EDITOR_MODE_OPTIONS = [
  { label: 'Automatic', value: 'automatic' },
  { label: 'Desktop ODT', value: 'desktop-odt' },
  { label: 'HTML fallback', value: 'html-fallback' },
] as const;

export const PAGE_LAYOUT_OPTIONS = [
  { label: 'Pageless', value: 'pageless' },
  { label: 'Page width', value: 'page-width' },
] as const;
