import { OFFICE_RUNTIME_BUNDLED_PATHS } from './constants';
import type {
  OfficeRuntimeCandidate,
  OfficeRuntimeExecutionResult,
  OfficeRuntimeOperatingSystem,
} from './interfaces';

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

export function getOfficeRuntimeVersion(result: OfficeRuntimeExecutionResult): string | null {
  const outputLines = `${result.standardOutput}\n${result.standardError}`.split(/\r?\n/);

  const versionLine = outputLines.find((line) => /libreoffice/i.test(line.trim()));

  return versionLine?.trim() ?? null;
}

export function isUnsafeOfficeRuntimePath(executablePath: string): boolean {
  const trimmedPath = executablePath.trim();

  return (
    trimmedPath.length === 0 ||
    trimmedPath.includes('\0') ||
    /[\r\n]/.test(trimmedPath) ||
    /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmedPath) ||
    /[;&|<>`$]/.test(trimmedPath) ||
    isNetworkPath(trimmedPath) ||
    !isAbsoluteLocalPath(trimmedPath)
  );
}

function joinPortablePath(basePath: string, relativePath: string): string {
  const separator = basePath.includes('\\') ? '\\' : '/';

  return `${basePath.replace(/[\\/]+$/, '')}${separator}${relativePath.replace(/[\\/]/g, separator)}`;
}

function isAbsoluteLocalPath(executablePath: string): boolean {
  return /^[A-Za-z]:[\\/]/.test(executablePath) || executablePath.startsWith('/');
}

function isNetworkPath(executablePath: string): boolean {
  return executablePath.startsWith('\\\\') || executablePath.startsWith('//');
}
