import {
  collectChangedSourceStates,
  createContentHash,
  createSourceSnapshot,
  hasSourceStateChanged,
} from './sourceState';
import { createVaultAdapter } from '../../rich-documents/utils';

test('hash changes when source content changes independently of timestamps', async () => {
  const firstHash = createContentHash('first source');
  const secondHash = createContentHash('second source');

  expect(firstHash).not.toBe(secondHash);
});

test('captures source existence hash and modified time', async () => {
  const vault = createVaultAdapter(new Map([['Note.md', 'Initial']]));

  const sourceState = await createSourceSnapshot({
    path: 'Note.md',
    vaultAdapter: vault.adapter,
  });

  expect(sourceState.exists).toBe(true);
  expect(sourceState.contentHash).toBe(createContentHash('Initial'));
  expect(sourceState.modifiedTime).toBe(1);
});

test('modified time changes with identical content do not create false conflicts', () => {
  const previousState = { contentHash: createContentHash('same'), exists: true, modifiedTime: 1 };
  const currentState = { contentHash: createContentHash('same'), exists: true, modifiedTime: 2 };

  expect(hasSourceStateChanged(previousState, currentState)).toBe(false);
});

test('collects changed source states from hash and delete changes', () => {
  const previousStates = {
    html: { contentHash: 'a', exists: true, modifiedTime: 1 },
    markdown: { contentHash: 'b', exists: true, modifiedTime: 1 },
  };

  const currentStates = {
    html: { contentHash: null, exists: false, modifiedTime: null },
    markdown: { contentHash: 'changed', exists: true, modifiedTime: 1 },
  };

  expect(
    collectChangedSourceStates(previousStates, currentStates).map((change) => change.source)
  ).toEqual(['markdown', 'html']);
});
