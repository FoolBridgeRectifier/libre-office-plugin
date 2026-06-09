import type { AutosaveStatus } from '../autosave/interfaces';
import type { ConflictResolutionChoice } from '../conflicts/interfaces';
import type { EditorNavigationHandlers } from '../editor-navigation/interfaces';
import type { OfficeRuntimeSetupState } from '../office-runtime/interfaces';
import type {
  LibreNoteEditorActiveSource,
  LibreNoteEditorMode,
  LibreNoteEditorPageLayout,
} from '../settings/interfaces';

interface RibbonCommandDefinition {
  readonly description: string;
  readonly disabled?: boolean;
  readonly future?: boolean;
  readonly iconName: string;
  readonly id: string;
  readonly label: string;
}

interface RibbonCommandGroupDefinition {
  readonly commands: ReadonlyArray<RibbonCommandDefinition>;
  readonly id: string;
  readonly label: string;
}

export interface RibbonTabDefinition {
  readonly commandGroups: ReadonlyArray<RibbonCommandGroupDefinition>;
  readonly id: string;
  readonly label: string;
}

export interface RibbonEditorProps extends EditorNavigationHandlers {
  readonly activeFilePath?: string | null;
  readonly activeEditorSource?: LibreNoteEditorActiveSource;
  readonly autosaveStatus?: AutosaveStatus;
  readonly desktopSourceStatus?: 'idle' | 'loading' | 'error';
  readonly editorMode?: LibreNoteEditorMode;
  readonly importedHtmlSource?: string | null;
  readonly isResolvingConflict?: boolean;
  readonly linkWarningCount?: number;
  readonly officeRuntimeSetupState?: OfficeRuntimeSetupState;
  readonly pageLayout?: LibreNoteEditorPageLayout;
  readonly showHtmlEmptyState?: boolean;
  readonly onEditorBlur?: () => void;
  readonly onHtmlSourceChange?: (htmlSource: string) => void;
  readonly onResolveConflict?: (choice: ConflictResolutionChoice) => void;
}
