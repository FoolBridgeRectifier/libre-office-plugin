import type { OfficeRuntimeSetupState } from '../../office-runtime/interfaces';
import type {
  LibreNoteEditorActiveSource,
  LibreNoteEditorMode,
  LibreNoteEditorPageLayout,
} from '../../settings/interfaces';

export interface StatusFooterProps {
  readonly activeFilePath: string | null;
  readonly activeEditorSource: LibreNoteEditorActiveSource;
  readonly editorMode: LibreNoteEditorMode;
  readonly filePathClassName: string;
  readonly htmlSourceStatusText: string;
  readonly linkWarningStatusText: string;
  readonly officeRuntimeSetupState: OfficeRuntimeSetupState;
  readonly pageLayout: LibreNoteEditorPageLayout;
  readonly statusClassName: string;
}
