import { getConfiguredOfficeRuntimePath, isUnsafeOfficeRuntimePath } from './helpers';
import { createRuntimeDependencies } from './helpers/test-runtime/testRuntime';
import { detectOfficeRuntime, validateOfficeRuntimePath } from './officeRuntime';

test('detects configured LibreOffice path before bundled or system paths', async () => {
  const configuredPath = 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';

  const dependencies = createRuntimeDependencies({
    files: [
      configuredPath,
      'C:\\Vault\\.obsidian\\plugins\\libre-note-editor\\runtime\\LibreOffice\\program\\soffice.exe',
      'C:\\System\\soffice.exe',
    ],
    systemExecutables: { 'soffice.exe': 'C:\\System\\soffice.exe' },
  });

  const state = await detectOfficeRuntime({
    bundledRootPath: 'C:\\Vault\\.obsidian\\plugins\\libre-note-editor\\runtime',
    configuredPath,
    dependencies,
    operatingSystem: 'windows',
    platform: 'desktop',
  });

  expect(state).toEqual(expect.objectContaining({ source: 'configured', status: 'ready' }));
  expect(dependencies.process.findExecutable).not.toHaveBeenCalled();
});

test('detects bundled runtime before falling back to system LibreOffice', async () => {
  const bundledPath =
    'C:\\Vault\\.obsidian\\plugins\\libre-note-editor\\runtime\\LibreOffice\\program\\soffice.exe';

  const dependencies = createRuntimeDependencies({
    files: [bundledPath, 'C:\\System\\soffice.exe'],
    systemExecutables: { 'soffice.exe': 'C:\\System\\soffice.exe' },
  });

  const state = await detectOfficeRuntime({
    bundledRootPath: 'C:\\Vault\\.obsidian\\plugins\\libre-note-editor\\runtime',
    dependencies,
    operatingSystem: 'windows',
    platform: 'desktop',
  });

  expect(state).toEqual(expect.objectContaining({ source: 'bundled', status: 'ready' }));
  expect(dependencies.process.findExecutable).not.toHaveBeenCalled();
});

test('falls back to system LibreOffice when no configured or bundled runtime exists', async () => {
  const dependencies = createRuntimeDependencies({
    files: ['/usr/bin/soffice'],
    systemExecutables: { soffice: '/usr/bin/soffice' },
  });

  const state = await detectOfficeRuntime({
    dependencies,
    operatingSystem: 'linux',
    platform: 'desktop',
  });

  expect(state).toEqual(
    expect.objectContaining({
      executablePath: '/usr/bin/soffice',
      source: 'system',
      status: 'ready',
    })
  );
});

test('reports missing runtime when no desktop candidate can be found', async () => {
  const state = await detectOfficeRuntime({
    dependencies: createRuntimeDependencies(),
    operatingSystem: 'linux',
    platform: 'desktop',
  });

  expect(state.status).toBe('missing');
  expect(state.isBlocking).toBe(true);
  expect(state.message).toBe('LibreOffice was not found. HTML editing remains available.');
});

test('rejects unsafe and nonexistent configured paths', async () => {
  const dependencies = createRuntimeDependencies();

  const unsafeResult = await validateOfficeRuntimePath('https://example.com/soffice', dependencies);

  const missingResult = await validateOfficeRuntimePath(
    '/opt/libreoffice/program/soffice',
    dependencies
  );

  expect(unsafeResult.status).toBe('invalid');
  expect(missingResult.status).toBe('invalid');
  expect(dependencies.process.executeFile).not.toHaveBeenCalled();
});

test('rejects directories and executables that fail version checks', async () => {
  const dependencies = createRuntimeDependencies({
    directories: ['/Applications/LibreOffice.app'],
    files: ['/Applications/LibreOffice.app/Contents/MacOS/soffice'],
    validationResults: {
      '/Applications/LibreOffice.app/Contents/MacOS/soffice': {
        exitCode: 1,
        standardError: 'permission denied',
        standardOutput: '',
      },
    },
  });

  const directoryResult = await validateOfficeRuntimePath(
    '/Applications/LibreOffice.app',
    dependencies
  );

  const failedResult = await validateOfficeRuntimePath(
    '/Applications/LibreOffice.app/Contents/MacOS/soffice',
    dependencies
  );

  expect(directoryResult).toEqual({
    diagnostic: 'LibreOffice path points to a directory.',
    status: 'invalid',
  });

  expect(failedResult).toEqual({
    diagnostic: 'LibreOffice version check failed.',
    status: 'invalid',
  });
});

test('skips LibreOffice requirement on mobile', async () => {
  const dependencies = createRuntimeDependencies();

  const state = await detectOfficeRuntime({
    configuredPath: '/opt/libreoffice/program/soffice',
    dependencies,
    operatingSystem: 'linux',
    platform: 'mobile',
  });

  expect(state.status).toBe('skipped-mobile');
  expect(state.isBlocking).toBe(false);
  expect(dependencies.fileSystem.pathExists).not.toHaveBeenCalled();
});

test('returns setup state messages for invalid configured and unsupported desktop modes', async () => {
  const invalidState = await detectOfficeRuntime({
    configuredPath: '/opt/libreoffice/program/soffice',
    dependencies: createRuntimeDependencies(),
    operatingSystem: 'linux',
    platform: 'desktop',
  });

  const unsupportedState = await detectOfficeRuntime({
    dependencies: createRuntimeDependencies(),
    operatingSystem: 'unsupported',
    platform: 'desktop',
  });

  expect(invalidState.message).toBe('LibreOffice is configured but could not be used.');
  expect(unsupportedState.message).toBe('LibreOffice desktop detection is not supported here.');
});

test('extracts configured path from current and legacy plugin data shapes', () => {
  expect(getConfiguredOfficeRuntimePath({ settings: { libreOfficePath: '/opt/soffice' } })).toBe(
    '/opt/soffice'
  );

  expect(
    getConfiguredOfficeRuntimePath({ officeRuntime: { configuredPath: '/app/soffice' } })
  ).toBe('/app/soffice');

  expect(getConfiguredOfficeRuntimePath({ libreOfficePath: 'C:\\LibreOffice\\soffice.exe' })).toBe(
    'C:\\LibreOffice\\soffice.exe'
  );
});

test('runtime module exposes pure helpers without filesystem side effects', () => {
  expect(isUnsafeOfficeRuntimePath('/opt/libreoffice/program/soffice; rm -rf /')).toBe(true);
  expect(isUnsafeOfficeRuntimePath('/opt/libreoffice/program/soffice')).toBe(false);
});
