import {
  DEFAULT_OFFICE_RUNTIME_TIMEOUT_MS,
  OFFICE_RUNTIME_VERSION_ARGUMENTS,
} from '../../constants';
import { getOfficeRuntimeVersion, isUnsafeOfficeRuntimePath } from '../../helpers';
import type {
  OfficeRuntimeDependencies,
  OfficeRuntimeExecutionResult,
  OfficeRuntimeValidationResult,
} from '../../interfaces';

export async function validateOfficeRuntimePath(
  executablePath: string,
  dependencies: OfficeRuntimeDependencies,
  timeoutMs = DEFAULT_OFFICE_RUNTIME_TIMEOUT_MS
): Promise<OfficeRuntimeValidationResult> {
  try {
    return await validateSafeOfficeRuntimePath(executablePath, dependencies, timeoutMs);
  } catch {
    return { diagnostic: 'LibreOffice path could not be inspected.', status: 'invalid' };
  }
}

async function validateSafeOfficeRuntimePath(
  executablePath: string,
  dependencies: OfficeRuntimeDependencies,
  timeoutMs: number
): Promise<OfficeRuntimeValidationResult> {
  if (isUnsafeOfficeRuntimePath(executablePath)) {
    return {
      diagnostic: 'LibreOffice path must be an absolute local executable path.',
      status: 'invalid',
    };
  }

  if (!(await dependencies.fileSystem.pathExists(executablePath))) {
    return { diagnostic: 'LibreOffice executable does not exist.', status: 'invalid' };
  }

  if (await dependencies.fileSystem.isDirectory(executablePath)) {
    return { diagnostic: 'LibreOffice path points to a directory.', status: 'invalid' };
  }

  if (!(await dependencies.fileSystem.isFile(executablePath))) {
    return { diagnostic: 'LibreOffice path is not an executable file.', status: 'invalid' };
  }

  return validateExecutableVersion(executablePath, dependencies, timeoutMs);
}

async function validateExecutableVersion(
  executablePath: string,
  dependencies: OfficeRuntimeDependencies,
  timeoutMs: number
): Promise<OfficeRuntimeValidationResult> {
  const result = await executeVersionCheck(executablePath, dependencies, timeoutMs);

  const version = getOfficeRuntimeVersion(result);

  if (result.exitCode === 0 && version !== null) {
    return { executablePath, status: 'valid', version };
  }

  return {
    diagnostic: result.timedOut
      ? 'LibreOffice version check timed out.'
      : 'LibreOffice version check failed.',
    status: 'invalid',
  };
}

async function executeVersionCheck(
  executablePath: string,
  dependencies: OfficeRuntimeDependencies,
  timeoutMs: number
): Promise<OfficeRuntimeExecutionResult> {
  try {
    return await dependencies.process.executeFile(
      executablePath,
      OFFICE_RUNTIME_VERSION_ARGUMENTS,
      timeoutMs
    );
  } catch {
    return {
      exitCode: null,
      standardError: '',
      standardOutput: '',
    };
  }
}
