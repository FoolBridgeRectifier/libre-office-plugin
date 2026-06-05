import type { ConflictResolutionChoice } from '../../interfaces';
import type {
  RichDocumentActiveSource,
  RichDocumentMapping,
} from '../../../rich-documents/interfaces';

function getActiveSourceForChoice(choice: ConflictResolutionChoice): RichDocumentActiveSource {
  if (choice === 'desktop') {
    return 'html';
  }

  if (choice === 'mobile') {
    return 'markdown';
  }

  if (choice === 'duplicate-conflict-copy') {
    return 'html';
  }

  return choice;
}

export function resolveConflictMapping(
  mapping: RichDocumentMapping,
  choice: ConflictResolutionChoice,
  resolvedAt: string
): RichDocumentMapping {
  const activeSource = getActiveSourceForChoice(choice);

  return {
    ...mapping,
    activeSource,
    conflictState: { status: 'none' },
    syncTimestamps: {
      ...mapping.syncTimestamps,
      lastSyncedAt: resolvedAt,
    },
  };
}
