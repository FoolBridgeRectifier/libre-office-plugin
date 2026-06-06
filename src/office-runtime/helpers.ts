import { OFFICE_RUNTIME_BUNDLED_PATHS, OFFICE_RUNTIME_SYSTEM_COMMANDS } from './constants';
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

export function createConfiguredRuntimeCandidate(
  configuredPath: string | null | undefined
): OfficeRuntimeCandidate | null {
  const normalizedConfiguredPath = configuredPath?.trim();

  return normalizedConfiguredPath
    ? { executablePath: normalizedConfiguredPath, source: 'configured' }
    : null;
}

export function createSystemRuntimeCandidates(
  executablePaths: ReadonlyArray<string>
): ReadonlyArray<OfficeRuntimeCandidate> {
  return executablePaths.map((executablePath) => ({
    executablePath,
    source: 'system',
  }));
}

export function getConfiguredOfficeRuntimePath(data: unknown): string | null {
  const dataRecord = isRecord(data) ? data : {};
  const settingsRecord = isRecord(dataRecord.settings) ? dataRecord.settings : {};
  const runtimeRecord = isRecord(dataRecord.officeRuntime) ? dataRecord.officeRuntime : {};

  return (
    getString(settingsRecord.libreOfficePath) ??
    getString(runtimeRecord.configuredPath) ??
    getString(dataRecord.libreOfficePath)
  );
}

export function getOfficeRuntimeVersion(result: OfficeRuntimeExecutionResult): string | null {
  const outputLines = `${result.standardOutput}\n${result.standardError}`.split(/\r?\n/);

  const versionLine = outputLines.find((line) => /libreoffice/i.test(line.trim()));

  return versionLine?.trim() ?? null;
}

export function getSystemRuntimeCommandNames(
  operatingSystem: OfficeRuntimeOperatingSystem
): ReadonlyArray<string> {
  return OFFICE_RUNTIME_SYSTEM_COMMANDS[operatingSystem];
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

export function joinPortablePath(basePath: string, relativePath: string): string {
  const separator = basePath.includes('\\') ? '\\' : '/';

  return `${basePath.replace(/[\\/]+$/, '')}${separator}${relativePath.replace(/[\\/]/g, separator)}`;
}

function getString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function isAbsoluteLocalPath(executablePath: string): boolean {
  return /^[A-Za-z]:[\\/]/.test(executablePath) || executablePath.startsWith('/');
}

function isNetworkPath(executablePath: string): boolean {
  return executablePath.startsWith('\\\\') || executablePath.startsWith('//');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
