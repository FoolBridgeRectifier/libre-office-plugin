import { OFFICE_RUNTIME_BUNDLED_PATHS } from './constants';
import type { OfficeRuntimeCandidate, OfficeRuntimeOperatingSystem } from './interfaces';

export function createBundledRuntimeCandidates(
  bundledRootPath: string | null | undefined,
  operatingSystem: OfficeRuntimeOperatingSystem
): ReadonlyArray<OfficeRuntimeCandidate> {
  if (!bundledRootPath) {
    return [];
  }

  return OFFICE_RUNTIME_BUNDLED_PATHS[operatingSystem].map((relativePath) => ({
    executablePath: joinPortablePath(bundledRootPath, relativePath),
    source: 'bundled',
  }));
}

function joinPortablePath(basePath: string, relativePath: string): string {
  const separator = basePath.includes('\\') ? '\\' : '/';

  return `${basePath.replace(/[\\/]+$/, '')}${separator}${relativePath.replace(/[\\/]/g, separator)}`;
}
