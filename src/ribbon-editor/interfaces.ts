import type { AutosaveStatus } from '../autosave/interfaces';
import type { ConflictResolutionChoice } from '../conflicts/interfaces';
import type { OfficeRuntimeSetupState } from '../office-runtime/interfaces';

export interface RibbonCommandDefinition {
  readonly description: string;
  readonly disabled?: boolean;
  readonly future?: boolean;
  readonly iconName: string;
  readonly id: string;
  readonly label: string;
}

export interface RibbonCommandGroupDefinition {
  readonly commands: ReadonlyArray<RibbonCommandDefinition>;
  readonly id: string;
  readonly label: string;
}

export interface RibbonTabDefinition {
  readonly commandGroups: ReadonlyArray<RibbonCommandGroupDefinition>;
  readonly id: string;
  readonly label: string;
}

export interface RibbonEditorProps {
  readonly activeFilePath?: string | null;
  readonly autosaveStatus?: AutosaveStatus;
  readonly importedHtmlSource?: string | null;
  readonly isResolvingConflict?: boolean;
  readonly linkWarningCount?: number;
  readonly officeRuntimeSetupState?: OfficeRuntimeSetupState;
  readonly onEditorBlur?: () => void;
  readonly onHtmlSourceChange?: (htmlSource: string) => void;
  readonly onResolveConflict?: (choice: ConflictResolutionChoice) => void;
}
