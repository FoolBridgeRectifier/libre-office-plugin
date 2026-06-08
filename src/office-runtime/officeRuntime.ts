import { DEFAULT_OFFICE_RUNTIME_TIMEOUT_MS } from './constants';
import { createBundledRuntimeCandidates } from './helpers';
import { createDefaultOfficeRuntimeDependencies } from './node-runtime/nodeRuntime';
import {
  createMissingRuntimeSetupState,
  createReadyRuntimeSetupState,
  createSkippedMobileRuntimeSetupState,
  createUnsupportedRuntimeSetupState,
} from './setup-state/setupState';
import { validateOfficeRuntimePath } from './validation/validation';
import type {
  OfficeRuntimeCandidate,
  OfficeRuntimeDependencies,
  OfficeRuntimeDetectionOptions,
  OfficeRuntimeSetupState,
} from './interfaces';

export { validateOfficeRuntimePath } from './validation/validation';

export async function detectOfficeRuntime(
  options: OfficeRuntimeDetectionOptions
): Promise<OfficeRuntimeSetupState> {
  try {
    return await detectOfficeRuntimeSafely(options);
  } catch {
    return createMissingRuntimeSetupState('LibreOffice detection could not start.');
  }
}

async function detectOfficeRuntimeSafely(
  options: OfficeRuntimeDetectionOptions
): Promise<OfficeRuntimeSetupState> {
  if (options.platform === 'mobile') {
    return createSkippedMobileRuntimeSetupState();
  }

  if (options.operatingSystem === 'unsupported') {
    return createUnsupportedRuntimeSetupState();
  }

  const dependencies = options.dependencies ?? (await createDefaultOfficeRuntimeDependencies());
  const timeoutMs = options.timeoutMs ?? DEFAULT_OFFICE_RUNTIME_TIMEOUT_MS;

  const bundledCandidates = createBundledRuntimeCandidates(
    options.bundledRootPath,
    options.operatingSystem
  );

  const bundledResult = await findFirstValidRuntimeCandidate(
    bundledCandidates,
    dependencies,
    timeoutMs
  );

  if (bundledResult) {
    return bundledResult;
  }

  return createMissingRuntimeSetupState(
    'Bundled LibreOffice runtime was not found inside the plugin runtime folder.'
  );
}

async function findFirstValidRuntimeCandidate(
  candidates: ReadonlyArray<OfficeRuntimeCandidate>,
  dependencies: OfficeRuntimeDependencies,
  timeoutMs: number
): Promise<OfficeRuntimeSetupState | null> {
  for (const candidate of candidates) {
    const validationResult = await validateOfficeRuntimePath(
      candidate.executablePath,
      dependencies,
      timeoutMs
    );

    if (validationResult.status === 'valid') {
      return createReadyRuntimeSetupState(candidate, validationResult);
    }
  }

  return null;
}
