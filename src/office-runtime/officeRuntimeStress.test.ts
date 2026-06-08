import { OFFICE_RUNTIME_VERSION_ARGUMENTS } from './constants';
import { isUnsafeOfficeRuntimePath } from './helpers';
import { createRuntimeDependencies } from './helpers/test-runtime/testRuntime';
import { detectOfficeRuntime, validateOfficeRuntimePath } from './officeRuntime';

test('bundled paths with spaces validate and use only the version probe arguments', async () => {
  const executablePath = 'C:\\Vault Path\\plugin\\runtime\\LibreOffice\\program\\soffice.com';
  const dependencies = createRuntimeDependencies({ files: [executablePath] });

  const state = await detectOfficeRuntime({
    bundledRootPath: 'C:\\Vault Path\\plugin\\runtime',
    dependencies,
    operatingSystem: 'windows',
    platform: 'desktop',
  });

  expect(state).toEqual(expect.objectContaining({ source: 'bundled', status: 'ready' }));

  expect(dependencies.process.executeFile).toHaveBeenCalledWith(
    executablePath,
    OFFICE_RUNTIME_VERSION_ARGUMENTS,
    5000
  );

  expect(OFFICE_RUNTIME_VERSION_ARGUMENTS.some((argument) => /macro/i.test(argument))).toBe(false);
});

test('invalid bundled runtime does not silently fall back to system paths', async () => {
  const bundledPath = 'C:\\Vault\\plugin\\runtime\\LibreOffice\\program\\soffice.com';

  const dependencies = createRuntimeDependencies({
    files: [bundledPath, 'C:\\Configured\\soffice.exe', 'C:\\System\\soffice.exe'],
    systemExecutables: { 'soffice.exe': 'C:\\System\\soffice.exe' },
    validationResults: {
      [bundledPath]: { exitCode: 1, standardError: 'bad bundle', standardOutput: '' },
    },
  });

  const state = await detectOfficeRuntime({
    bundledRootPath: 'C:\\Vault\\plugin\\runtime',
    dependencies,
    operatingSystem: 'windows',
    platform: 'desktop',
  });

  expect(state.status).toBe('missing');
  expect(dependencies.process.findExecutable).not.toHaveBeenCalled();
});

test('unexpected bundled detection failures become missing setup state instead of rejecting', async () => {
  const dependencies = createRuntimeDependencies();

  jest.mocked(dependencies.fileSystem.pathExists).mockRejectedValue(new Error('discovery failed'));

  const state = await detectOfficeRuntime({
    bundledRootPath: '/vault/plugin/runtime',
    dependencies,
    operatingSystem: 'linux',
    platform: 'desktop',
  });

  expect(state).toEqual(
    expect.objectContaining({
      diagnostic: 'Bundled LibreOffice runtime was not found inside the plugin runtime folder.',
      status: 'missing',
    })
  );
});

test('timeout, permission denied, and launch exceptions become invalid setup diagnostics', async () => {
  const timeoutPath = '/opt/libreoffice/program/soffice';
  const deniedPath = '/blocked/libreoffice/program/soffice';

  const dependencies = createRuntimeDependencies({
    files: [timeoutPath, deniedPath],
    validationResults: {
      [timeoutPath]: { exitCode: null, standardError: '', standardOutput: '', timedOut: true },
    },
  });

  jest.mocked(dependencies.fileSystem.isDirectory).mockRejectedValueOnce(new Error('EACCES'));
  jest.mocked(dependencies.process.executeFile).mockRejectedValueOnce(new Error('EACCES'));

  const deniedResult = await validateOfficeRuntimePath(deniedPath, dependencies);
  const launchResult = await validateOfficeRuntimePath(timeoutPath, dependencies);
  const timeoutResult = await validateOfficeRuntimePath(timeoutPath, dependencies);

  expect(deniedResult).toEqual({
    diagnostic: 'LibreOffice path could not be inspected.',
    status: 'invalid',
  });

  expect(launchResult).toEqual({
    diagnostic: 'LibreOffice version check failed.',
    status: 'invalid',
  });

  expect(timeoutResult).toEqual({
    diagnostic: 'LibreOffice version check timed out.',
    status: 'invalid',
  });
});

test('unsafe local path shapes are rejected before filesystem inspection', async () => {
  const dependencies = createRuntimeDependencies();

  expect(isUnsafeOfficeRuntimePath('relative/soffice')).toBe(true);
  expect(isUnsafeOfficeRuntimePath('\\\\server\\share\\soffice.exe')).toBe(true);
  expect(isUnsafeOfficeRuntimePath('/opt/libreoffice\n/program/soffice')).toBe(true);
  expect(isUnsafeOfficeRuntimePath('/opt/libreoffice/program/soffice;echo bad')).toBe(true);

  const result = await validateOfficeRuntimePath('relative/soffice', dependencies);

  expect(result.status).toBe('invalid');
  expect(dependencies.fileSystem.pathExists).not.toHaveBeenCalled();
});
