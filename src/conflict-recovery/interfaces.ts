import type { ConflictResolutionChoice } from '../conflicts/interfaces';

export interface ConflictRecoveryChoiceDefinition {
  readonly choice: ConflictResolutionChoice;
  readonly label: string;
}

export interface ConflictRecoveryPanelProps {
  readonly isResolvingConflict?: boolean;
  readonly onResolveConflict: (choice: ConflictResolutionChoice) => void;
}
