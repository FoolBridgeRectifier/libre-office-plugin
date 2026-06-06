import type { OfficeRuntimeDependencies, OfficeRuntimeMockOptions } from '../../interfaces';

export function createRuntimeDependencies(
  options: OfficeRuntimeMockOptions = {}
): OfficeRuntimeDependencies {
  const files = new Set(options.files ?? []);
  const directories = new Set(options.directories ?? []);
  const systemExecutables = options.systemExecutables ?? {};
  const validationResults = options.validationResults ?? {};

  return {
    fileSystem: {
      isDirectory: jest.fn(async (executablePath: string) => directories.has(executablePath)),
      isFile: jest.fn(async (executablePath: string) => files.has(executablePath)),
      pathExists: jest.fn(
        async (executablePath: string) =>
          files.has(executablePath) || directories.has(executablePath)
      ),
    },
    process: {
      executeFile: jest.fn(async (executablePath: string) => {
        return (
          validationResults[executablePath] ?? {
            exitCode: 0,
            standardError: '',
            standardOutput: 'LibreOffice 24.8.0.0',
          }
        );
      }),
      findExecutable: jest.fn(
        async (executableName: string) => systemExecutables[executableName] ?? null
      ),
    },
  };
}
