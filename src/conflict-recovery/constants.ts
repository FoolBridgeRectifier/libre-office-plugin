import type { ConflictRecoveryChoiceDefinition } from './interfaces';

export const CONFLICT_RECOVERY_CHOICES: ConflictRecoveryChoiceDefinition[] = [
  {
    choice: 'html',
    label: 'Rich HTML',
  },
  {
    choice: 'markdown',
    label: 'Markdown',
  },
  {
    choice: 'duplicate-conflict-copy',
    label: 'Duplicate',
  },
];
