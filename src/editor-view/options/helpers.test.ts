import { openExternalUrl, openInternalLinkTarget, openTagSearch } from './helpers';

test('opens internal markdown links through Obsidian workspace navigation', async () => {
  const linkedFile = { extension: 'md', path: 'Target.md' };
  const getFirstLinkpathDest = jest.fn(() => linkedFile);
  const openFile = jest.fn();

  await openInternalLinkTarget(
    {
      metadataCache: { getFirstLinkpathDest },
      vault: { getAbstractFileByPath: jest.fn() },
      workspace: { getLeaf: jest.fn(() => ({ openFile })) },
    } as never,
    'Target#Heading',
    'Source.md'
  );

  expect(getFirstLinkpathDest).toHaveBeenCalledWith('Target', 'Source.md');
  expect(openFile).toHaveBeenCalledWith(linkedFile);
});

test('opens tag searches through global search and reveals the search leaf', () => {
  const openGlobalSearch = jest.fn();
  const revealLeaf = jest.fn();
  const setQuery = jest.fn();

  const searchLeaf = { view: { setQuery } };

  openTagSearch(
    {
      internalPlugins: {
        getPluginById: jest.fn(() => ({ instance: { openGlobalSearch } })),
      },
      workspace: {
        getLeavesOfType: jest.fn(() => [searchLeaf]),
        revealLeaf,
      },
    } as never,
    '#parent/child'
  );

  expect(openGlobalSearch).toHaveBeenCalledWith('tag:parent/child');
  expect(setQuery).toHaveBeenCalledWith('tag:parent/child');
  expect(revealLeaf).toHaveBeenCalledWith(searchLeaf);
});

test('opens external urls through Electron shell when available', async () => {
  const openExternal = jest.fn(async () => undefined);
  const browserOpen = jest.fn();
  const electronRequire = jest.fn(() => ({ shell: { openExternal } }));

  await openExternalUrl(
    'https://example.com/native',
    electronRequire as unknown as NodeJS.Require,
    browserOpen
  );

  expect(electronRequire).toHaveBeenCalledWith('electron');
  expect(openExternal).toHaveBeenCalledWith('https://example.com/native');
  expect(browserOpen).not.toHaveBeenCalled();
});

test('falls back to browser open when Electron shell is unavailable', async () => {
  const browserOpen = jest.fn();
  const electronRequire = jest.fn(() => {
    throw new Error('electron unavailable');
  });

  await openExternalUrl(
    'https://example.com/fallback',
    electronRequire as unknown as NodeJS.Require,
    browserOpen
  );

  expect(browserOpen).toHaveBeenCalledWith(
    'https://example.com/fallback',
    '_blank',
    'noopener,noreferrer'
  );
});
