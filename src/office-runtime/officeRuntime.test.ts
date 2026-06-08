import { isUnsafeOfficeRuntimePath } from './helpers';
import { createRuntimeDependencies } from './helpers/test-runtime/testRuntime';
import { detectOfficeRuntime, validateOfficeRuntimePath } from './officeRuntime';

test('detects bundled runtime from the plugin runtime folder', async () => {
  const bundledPath =
    'C:\\Vault\\.obsidian\\plugins\\libre-note-editor\\runtime\\LibreOffice\\program\\soffice.com';

  const dependencies = createRuntimeDependencies({
    files: [bundledPath],
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

test('ignores system LibreOffice paths on desktop', async () => {
  const bundledPath = '/vault/plugin/runtime/LibreOffice-linux/program/soffice';

  const dependencies = createRuntimeDependencies({
    files: ['/configured/soffice', '/usr/bin/soffice', bundledPath],
    systemExecutables: { soffice: '/usr/bin/soffice' },
  });

  const state = await detectOfficeRuntime({
    bundledRootPath: '/vault/plugin/runtime',
    dependencies,
    operatingSystem: 'linux',
    platform: 'desktop',
  });

  expect(state).toEqual(expect.objectContaining({ executablePath: bundledPath }));
  expect(dependencies.process.findExecutable).not.toHaveBeenCalled();
});

test('detects bundled macOS runtimes from architecture-specific app folders', async () => {
  const bundledPath = '/vault/plugin/runtime/LibreOffice.app/Contents/MacOS/soffice';

  const dependencies = createRuntimeDependencies({
    files: [bundledPath],
  });

  const state = await detectOfficeRuntime({
    bundledRootPath: '/vault/plugin/runtime',
    dependencies,
    operatingSystem: 'macos',
    platform: 'desktop',
  });

  expect(state).toEqual(expect.objectContaining({ executablePath: bundledPath }));
});

test('reports missing bundled runtime instead of falling back to system LibreOffice', async () => {
  const dependencies = createRuntimeDependencies({
    files: ['/usr/bin/soffice'],
    systemExecutables: { soffice: '/usr/bin/soffice' },
  });

  const state = await detectOfficeRuntime({
    bundledRootPath: '/vault/plugin/runtime',
    dependencies,
    operatingSystem: 'linux',
    platform: 'desktop',
  });

  expect(state.status).toBe('missing');
  expect(state.isBlocking).toBe(true);

  expect(state.message).toBe(
    'Bundled LibreOffice runtime was not found. HTML editing remains available.'
  );

  expect(dependencies.process.findExecutable).not.toHaveBeenCalled();
});

test('rejects unsafe and nonexistent runtime paths during validation', async () => {
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

test('skips bundled LibreOffice requirement on mobile', async () => {
  const dependencies = createRuntimeDependencies();

  const state = await detectOfficeRuntime({
    bundledRootPath: '/vault/plugin/runtime',
    dependencies,
    operatingSystem: 'linux',
    platform: 'mobile',
  });

  expect(state.status).toBe('skipped-mobile');
  expect(state.isBlocking).toBe(false);
  expect(dependencies.fileSystem.pathExists).not.toHaveBeenCalled();
});

test('returns setup state messages for missing bundled and unsupported desktop modes', async () => {
  const missingState = await detectOfficeRuntime({
    bundledRootPath: '/vault/plugin/runtime',
    dependencies: createRuntimeDependencies(),
    operatingSystem: 'linux',
    platform: 'desktop',
  });

  const unsupportedState = await detectOfficeRuntime({
    dependencies: createRuntimeDependencies(),
    operatingSystem: 'unsupported',
    platform: 'desktop',
  });

  expect(missingState).toEqual(
    expect.objectContaining({
      diagnostic: 'Bundled LibreOffice runtime was not found inside the plugin runtime folder.',
    })
  );

  expect(unsupportedState.message).toBe('LibreOffice desktop detection is not supported here.');
});

test('runtime module exposes pure helpers without filesystem side effects', () => {
  expect(isUnsafeOfficeRuntimePath('/opt/libreoffice/program/soffice; rm -rf /')).toBe(true);
  expect(isUnsafeOfficeRuntimePath('/opt/libreoffice/program/soffice')).toBe(false);
});
