import type { OfficeRuntimeExecutionResult } from '../interfaces';

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

function isAbsoluteLocalPath(executablePath: string): boolean {
  return /^[A-Za-z]:[\\/]/.test(executablePath) || executablePath.startsWith('/');
}

function isNetworkPath(executablePath: string): boolean {
  return executablePath.startsWith('\\\\') || executablePath.startsWith('//');
}
