import type { OfficeRuntimeOperatingSystem } from './interfaces';

export const DEFAULT_OFFICE_RUNTIME_TIMEOUT_MS = 5000;

export const OFFICE_RUNTIME_VERSION_ARGUMENTS = [
  '--headless',
  '--nologo',
  '--nodefault',
  '--nofirststartwizard',
  '--norestore',
  '--version',
];

export const OFFICE_RUNTIME_SYSTEM_COMMANDS: Record<
  OfficeRuntimeOperatingSystem,
  ReadonlyArray<string>
> = {
  linux: ['soffice', 'libreoffice'],
  macos: ['soffice', 'libreoffice'],
  unsupported: [],
  windows: ['soffice.exe', 'libreoffice.exe', 'soffice', 'libreoffice'],
};

export const OFFICE_RUNTIME_BUNDLED_PATHS: Record<
  OfficeRuntimeOperatingSystem,
  ReadonlyArray<string>
> = {
  linux: ['LibreOffice-linux/program/soffice'],
  macos: [
    'LibreOffice-aarch64.app/Contents/MacOS/soffice',
    'LibreOffice.app/Contents/MacOS/soffice',
  ],
  unsupported: [],
  windows: [
    'LibreOffice/program/soffice.com',
    'LibreOffice/program/soffice.exe',
    'LibreOffice/program/libreoffice.exe',
  ],
};
