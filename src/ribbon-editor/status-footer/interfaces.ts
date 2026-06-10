import type { LibreNoteEditorPageLayout } from '../../settings/interfaces';

export interface StatusFooterProps {
  readonly activeFilePath: string | null;
  readonly filePathClassName: string;
  readonly htmlSourceStatusText: string;
  readonly linkWarningStatusText: string;
  readonly pageLayout: LibreNoteEditorPageLayout;
  readonly statusClassName: string;
}
