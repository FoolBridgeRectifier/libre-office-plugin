import { OFFICE_RUNTIME_VERSION_ARGUMENTS } from './constants';
import { isUnsafeOfficeRuntimePath } from './helpers';
import { createRuntimeDependencies } from './helpers/test-runtime/testRuntime';
import { detectOfficeRuntime, validateOfficeRuntimePath } from './officeRuntime';

test('configured paths with spaces validate and use only the version probe arguments', async () => {
  const executablePath = 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';
  const dependencies = createRuntimeDependencies({ files: [executablePath] });

  const state = await detectOfficeRuntime({
    configuredPath: executablePath,
    dependencies,
    operatingSystem: 'windows',
    platform: 'desktop',
  });

  expect(state).toEqual(expect.objectContaining({ source: 'configured', status: 'ready' }));

  expect(dependencies.process.executeFile).toHaveBeenCalledWith(
    executablePath,
    OFFICE_RUNTIME_VERSION_ARGUMENTS,
    5000
  );

  expect(OFFICE_RUNTIME_VERSION_ARGUMENTS.some((argument) => /macro/i.test(argument))).toBe(false);
});

test('configured invalid runtime does not silently fall back to bundled or system paths', async () => {
  const dependencies = createRuntimeDependencies({
    files: ['C:\\System\\soffice.exe'],
    systemExecutables: { 'soffice.exe': 'C:\\System\\soffice.exe' },
  });

  const state = await detectOfficeRuntime({
    configuredPath: 'C:\\Missing\\soffice.exe',
    dependencies,
    operatingSystem: 'windows',
    platform: 'desktop',
  });

  expect(state.status).toBe('invalid');
  expect(dependencies.process.findExecutable).not.toHaveBeenCalled();
});

test('invalid bundled candidates are skipped before detecting a system runtime', async () => {
  const bundledPath = '/vault/plugin/runtime/libreoffice/program/soffice';
  const systemPath = '/usr/bin/soffice';

  const dependencies = createRuntimeDependencies({
    files: [bundledPath, systemPath],
    systemExecutables: { soffice: systemPath },
    validationResults: {
      [bundledPath]: { exitCode: 1, standardError: 'bad bundle', standardOutput: '' },
    },
  });

  const state = await detectOfficeRuntime({
    bundledRootPath: '/vault/plugin/runtime',
    dependencies,
    operatingSystem: 'linux',
    platform: 'desktop',
  });

  expect(state).toEqual(expect.objectContaining({ executablePath: systemPath, source: 'system' }));
});

test('unexpected discovery failures become missing setup state instead of rejecting', async () => {
  const dependencies = createRuntimeDependencies();

  jest.mocked(dependencies.process.findExecutable).mockRejectedValue(new Error('discovery failed'));

  const state = await detectOfficeRuntime({
    dependencies,
    operatingSystem: 'linux',
    platform: 'desktop',
  });

  expect(state).toEqual(
    expect.objectContaining({
      diagnostic: 'LibreOffice detection could not start.',
      status: 'missing',
    })
  );
});

test('multiple system runtimes choose the first executable that passes validation', async () => {
  const oldRuntimePath = '/usr/bin/soffice';
  const newRuntimePath = '/usr/local/bin/libreoffice';

  const dependencies = createRuntimeDependencies({
    files: [oldRuntimePath, newRuntimePath],
    systemExecutables: { libreoffice: newRuntimePath, soffice: oldRuntimePath },
    validationResults: {
      [oldRuntimePath]: { exitCode: 1, standardError: 'old runtime failed', standardOutput: '' },
      [newRuntimePath]: { exitCode: 0, standardError: '', standardOutput: 'LibreOffice 25.2' },
    },
  });

  const state = await detectOfficeRuntime({
    dependencies,
    operatingSystem: 'linux',
    platform: 'desktop',
  });

  expect(state).toEqual(
    expect.objectContaining({ executablePath: newRuntimePath, version: 'LibreOffice 25.2' })
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
