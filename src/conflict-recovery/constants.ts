import type { ConflictRecoveryChoiceDefinition } from './interfaces';

export const CONFLICT_RECOVERY_CHOICES: ConflictRecoveryChoiceDefinition[] = [
  {
    choice: 'desktop',
    label: 'Desktop',
  },
  {
    choice: 'mobile',
    label: 'Mobile',
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
