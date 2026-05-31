import {
  createArchivedRichDocumentMapping,
  createRichDocumentMapping,
  createRichDocumentPluginData,
  createStableRichDocumentId,
  normalizeRichDocumentPluginData,
} from './helpers';
import {
  archiveRichDocumentFiles,
  persistMappingSidecar,
  recoverMappingsFromSidecars,
} from './helpers/vault/vault';
import type {
  RichDocumentMapping,
  RichDocumentStore,
  RichDocumentStoreOptions,
} from './interfaces';

export function createRichDocumentStore(options: RichDocumentStoreOptions) {
  const getCurrentTimestamp = options.getCurrentTimestamp ?? (() => new Date().toISOString());
  const createRichDocumentId =
    options.createRichDocumentId ??
    (() => createStableRichDocumentId(getCurrentTimestamp(), Math.random()));

  let cachedMappings: ReadonlyArray<RichDocumentMapping> | null = null;
  let operationQueue = Promise.resolve();
  const ignoreQueuedResult = () => undefined;

  const saveMappings = async (mappings: ReadonlyArray<RichDocumentMapping>) => {
    cachedMappings = mappings;
    await options.persistenceTarget.saveData(createRichDocumentPluginData(mappings));
  };

  const loadMappings = async () => {
    if (cachedMappings) {
      return cachedMappings;
    }

    const pluginData = normalizeRichDocumentPluginData(await options.persistenceTarget.loadData());
    cachedMappings = pluginData.mappings.length > 0 ? pluginData.mappings : await recoverMappings();

    return cachedMappings;
  };

  const getMappingByMarkdownPath = async (markdownPath: string) =>
    (await loadMappings()).find((mapping) => mapping.markdownPath === markdownPath) ?? null;

  const getMappingByRichDocumentId = async (richDocumentId: string) =>
    (await loadMappings()).find((mapping) => mapping.richDocumentId === richDocumentId) ?? null;

  const runExclusive = async <TResult>(operation: () => Promise<TResult>) => {
    const queuedOperation = operationQueue.then(operation, operation);

    operationQueue = queuedOperation.then(ignoreQueuedResult, ignoreQueuedResult);

    return queuedOperation;
  };

  const recoverMappings = async () => {
    const mappings = await recoverMappingsFromSidecars(options.vaultAdapter);
    await saveMappings(mappings);

    return mappings;
  };

  const replaceMapping = async (mapping: RichDocumentMapping) => {
    const mappings = await loadMappings();
    const nextMappings = mappings.filter(
      (existingMapping) => existingMapping.richDocumentId !== mapping.richDocumentId
    );

    await persistMappingSidecar(options.vaultAdapter, mapping);
    await saveMappings([...nextMappings, mapping]);

    return mapping;
  };

  const createMapping = async (markdownPath: string) =>
    replaceMapping(
      createRichDocumentMapping(
        markdownPath,
        createRichDocumentId(),
        getCurrentTimestamp(),
        options.lastEditorPlatform ?? 'unknown'
      )
    );

  const store: RichDocumentStore = {
    archiveMapping: (markdownPath) =>
      runExclusive(async () => {
        const existingMapping = await getMappingByMarkdownPath(markdownPath);

        if (!existingMapping) {
          return null;
        }

        const timestamp = getCurrentTimestamp();

        const [htmlPath, odtPath] = await archiveRichDocumentFiles(
          options.vaultAdapter,
          existingMapping,
          timestamp
        );

        const archivedMapping = createArchivedRichDocumentMapping(
          existingMapping,
          htmlPath,
          odtPath,
          timestamp
        );

        return replaceMapping(archivedMapping);
      }),
    deleteMapping: (markdownPath) => store.archiveMapping(markdownPath),
    getMappingByMarkdownPath,
    getMappingByRichDocumentId,
    getOrCreateMapping: (markdownPath) =>
      runExclusive(async () => {
        const existingMapping = await getMappingByMarkdownPath(markdownPath);

        if (existingMapping) {
          return existingMapping;
        }

        return createMapping(markdownPath);
      }),
    loadMappings,
    recoverMappings,
    renameMapping: (previousMarkdownPath, nextMarkdownPath) =>
      runExclusive(async () => {
        const existingMapping =
          (await getMappingByMarkdownPath(previousMarkdownPath)) ??
          (await getMappingByMarkdownPath(nextMarkdownPath)) ??
          (await createMapping(nextMarkdownPath));

        return replaceMapping({ ...existingMapping, markdownPath: nextMarkdownPath });
      }),
    updateMapping: (markdownPath, patch) =>
      runExclusive(async () => {
        const existingMapping =
          (await getMappingByMarkdownPath(markdownPath)) ?? (await createMapping(markdownPath));

        return replaceMapping({ ...existingMapping, ...patch });
      }),
  };

  return store;
}
