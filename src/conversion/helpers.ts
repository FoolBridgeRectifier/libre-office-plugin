import { DEFAULT_CONVERSION_TIMEOUT_MS } from './constants';
import { createSourceStates } from '../conflicts';
import { isPathInsideRichDocumentsRoot } from '../rich-documents';
import type {
  ConversionCommand,
  ConversionFormat,
  DesktopConversionOptions,
  DesktopConversionPaths,
  DesktopConversionRuntime,
} from './interfaces';
import type { RichDocumentMapping } from '../rich-documents/interfaces';

export {
  sanitizeConvertedHtmlSource,
  sanitizeConvertedHtmlSourceWithReport,
  sanitizeHtmlFragmentSourceWithReport,
} from './sanitizer/sanitizer';
export {
  createLibreOfficeHtmlDocument,
  getOdtConversionHtmlPath,
  getOdtConversionOutputPath,
} from './odt-input/odtInput';

export function createConversionCommand(
  executablePath: string,
  inputPath: string,
  outputFolderPath: string,
  outputFormat: ConversionFormat
): ConversionCommand {
  return {
    argumentsList: [
      createUserInstallationArgument(outputFolderPath),
      '--headless',
      '--safe-mode',
      '--norestore',
      '--nolockcheck',
      '--nodefault',
      '--nofirststartwizard',
      '--convert-to',
      outputFormat,
      '--outdir',
      outputFolderPath,
      inputPath,
    ],
    executablePath,
  };
}

function createUserInstallationArgument(outputFolderPath: string): string {
  const normalizedProfilePath = `${outputFolderPath.replace(/[\\/]+$/, '')}/.libreoffice-profile`;
  const portableProfilePath = normalizedProfilePath.replace(/\\/g, '/');

  const absoluteProfilePath = portableProfilePath.startsWith('/')
    ? portableProfilePath
    : `/${portableProfilePath}`;

  return `-env:UserInstallation=${encodeURI(`file://${absoluteProfilePath}`)}`;
}

function assertSafeDesktopConversionPaths(paths: DesktopConversionPaths): void {
  if (
    !isPathInsideRichDocumentsRoot(paths.folderPath) ||
    !isPathInsideRichDocumentsRoot(paths.htmlPath) ||
    !isPathInsideRichDocumentsRoot(paths.odtPath) ||
    !paths.htmlPath.startsWith(`${paths.folderPath}/`) ||
    !paths.odtPath.startsWith(`${paths.folderPath}/`)
  ) {
    throw new Error(
      'Generated desktop conversion paths must stay inside the rich document folder.'
    );
  }
}

function getPathFolder(filePath: string): string {
  return filePath.split('/').slice(0, -1).join('/');
}

export function getDesktopConversionPaths(mapping: RichDocumentMapping): DesktopConversionPaths {
  const conversionPaths = {
    folderPath: getPathFolder(mapping.htmlPath),
    htmlPath: mapping.htmlPath,
    odtPath: mapping.odtPath,
  };

  assertSafeDesktopConversionPaths(conversionPaths);

  return conversionPaths;
}

export function resolveLocalVaultPath(vaultAdapter: unknown, normalizedPath: string): string {
  const localPathAdapter = vaultAdapter as {
    getFullPath?: (normalizedPath: string) => string;
  };

  return localPathAdapter.getFullPath?.(normalizedPath) ?? normalizedPath;
}

export function requireDesktopRuntime(
  runtime: DesktopConversionRuntime | null
): DesktopConversionRuntime {
  if (runtime === null) {
    throw new Error('LibreOffice is required for desktop ODT conversion.');
  }

  return runtime;
}

export async function runConversionCommand(
  runtime: DesktopConversionRuntime,
  inputPath: string,
  outputFolderPath: string,
  outputFormat: ConversionFormat
): Promise<void> {
  const command = createConversionCommand(
    runtime.executablePath,
    inputPath,
    outputFolderPath,
    outputFormat
  );

  const result = await runtime.process.executeFile(
    command.executablePath,
    command.argumentsList,
    DEFAULT_CONVERSION_TIMEOUT_MS
  );

  if (result.exitCode !== 0 || result.timedOut) {
    throw new Error('LibreOffice conversion failed.');
  }
}

export async function updateDesktopMapping(
  options: DesktopConversionOptions,
  currentTimestamp: string
): Promise<void> {
  const sourceStates = await createSourceStates(options.mapping, options.vaultAdapter);

  await options.richDocumentStore.updateMapping(options.mapping.markdownPath, {
    activeSource: 'odt',
    conflictState: { status: 'none' },
    sourceStates,
    syncTimestamps: {
      ...options.mapping.syncTimestamps,
      htmlSyncedAt: currentTimestamp,
      lastSyncedAt: currentTimestamp,
      markdownSyncedAt: currentTimestamp,
      odtSyncedAt: currentTimestamp,
    },
  });
}
