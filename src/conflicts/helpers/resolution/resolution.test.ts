import { resolveConflictMapping } from './resolution';
import { createRichDocumentMapping } from '../../../rich-documents/helpers';

test('conflict resolution updates selected source and clears conflict state', () => {
  const mapping = {
    ...createRichDocumentMapping('Note.md', 'rich-note', '2026-06-04', 'desktop'),
    conflictState: {
      changedSources: ['markdown', 'html'] as const,
      conflictCopies: [],
      detectedAt: '2026-06-05',
      reason: 'multi-source-change' as const,
      status: 'conflicted' as const,
    },
  };

  const resolvedMapping = resolveConflictMapping(mapping, 'mobile', '2026-06-06');

  expect(resolvedMapping.activeSource).toBe('markdown');
  expect(resolvedMapping.conflictState.status).toBe('none');
  expect(resolvedMapping.syncTimestamps.lastSyncedAt).toBe('2026-06-06');
});
