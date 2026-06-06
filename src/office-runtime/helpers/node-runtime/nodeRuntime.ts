import type { OfficeRuntimeDependencies, OfficeRuntimeExecutionResult } from '../../interfaces';
import type * as ChildProcess from 'child_process';
import type * as FileSystemPromises from 'fs/promises';
import type { execFile as nodeExecuteFile } from 'child_process';

export async function createDefaultOfficeRuntimeDependencies(): Promise<OfficeRuntimeDependencies> {
  const runtimeRequire: NodeJS.Require = require;
  const fileSystem = runtimeRequire('fs/promises') as typeof FileSystemPromises;
  const childProcess = runtimeRequire('child_process') as typeof ChildProcess;

  return {
    fileSystem: {
      isDirectory: async (executablePath) => (await fileSystem.stat(executablePath)).isDirectory(),
      isFile: async (executablePath) => (await fileSystem.stat(executablePath)).isFile(),
      pathExists: async (executablePath) => {
        try {
          await fileSystem.access(executablePath);

          return true;
        } catch {
          return false;
        }
      },
    },
    process: {
      executeFile: (executablePath, argumentsList, timeoutMs) =>
        executeNodeFile(childProcess.execFile, executablePath, argumentsList, timeoutMs),
      findExecutable: (executableName, timeoutMs) =>
        findNodeExecutable(childProcess.execFile, executableName, timeoutMs),
    },
  };
}

function executeNodeFile(
  executeFile: typeof nodeExecuteFile,
  executablePath: string,
  argumentsList: ReadonlyArray<string>,
  timeoutMs: number
): Promise<OfficeRuntimeExecutionResult> {
  return new Promise((resolve) => {
    executeFile(
      executablePath,
      [...argumentsList],
      { timeout: timeoutMs, windowsHide: true },
      (error, standardOutput, standardError) => {
        resolve({
          exitCode: getProcessExitCode(error),
          standardError,
          standardOutput,
          timedOut: getProcessTimedOut(error),
        });
      }
    );
  });
}

async function findNodeExecutable(
  executeFile: typeof nodeExecuteFile,
  executableName: string,
  timeoutMs: number
): Promise<string | null> {
  const locatorName = executableName.endsWith('.exe') ? 'where.exe' : 'which';
  const result = await executeNodeFile(executeFile, locatorName, [executableName], timeoutMs);

  if (result.exitCode !== 0) {
    return null;
  }

  return result.standardOutput.split(/\r?\n/)[0]?.trim() || null;
}

function getProcessExitCode(error: Error | null): number | null {
  const errorCode = (error as NodeJS.ErrnoException | null)?.code;

  if (!error) {
    return 0;
  }

  return typeof errorCode === 'number' ? errorCode : null;
}

function getProcessTimedOut(error: Error | null): boolean {
  return (error as NodeJS.ErrnoException | null)?.code === 'ETIMEDOUT';
}
