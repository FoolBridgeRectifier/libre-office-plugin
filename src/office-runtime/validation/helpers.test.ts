import { getOfficeRuntimeVersion, isUnsafeOfficeRuntimePath } from './helpers';

test('rejects unsafe local path shapes', () => {
  expect(isUnsafeOfficeRuntimePath('relative/soffice')).toBe(true);
  expect(isUnsafeOfficeRuntimePath('\\\\server\\share\\soffice.exe')).toBe(true);
  expect(isUnsafeOfficeRuntimePath('/opt/libreoffice\n/program/soffice')).toBe(true);
  expect(isUnsafeOfficeRuntimePath('/opt/libreoffice/program/soffice;echo bad')).toBe(true);

  expect(isUnsafeOfficeRuntimePath('/opt/libreoffice/program/soffice')).toBe(false);
});

test('reads LibreOffice version text from process output', () => {
  const version = getOfficeRuntimeVersion({
    exitCode: 0,
    standardError: '',
    standardOutput: 'LibreOffice 25.2.0.3',
  });

  expect(version).toBe('LibreOffice 25.2.0.3');
});
