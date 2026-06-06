import { createMarkdownMirrorSource } from '../autosave/helpers';
import { createSourceSnapshot } from '../conflicts/helpers';
import { createDefaultOfficeRuntimeDependencies } from '../office-runtime/helpers/node-runtime/nodeRuntime';
import { DEFAULT_OPEN_TIMEOUT_MS, ODT_MIME_TYPE, ODT_PACKAGE_SIGNATURE } from './constants';
import {
  createConversionCommand,
  createLibreOfficeHtmlDocument,
  getDesktopConversionPaths,
  getOdtConversionHtmlPath,
  getOdtConversionOutputPath,
  requireDesktopRuntime,
  resolveLocalVaultPath,
  runConversionCommand,
  sanitizeConvertedHtmlSource,
  updateDesktopMapping,
} from './helpers';
import type {
  DesktopConversionOptions,
  DesktopConversionRuntime,
  OdtSaveDetectionOptions,
  OdtSaveDetectionResult,
} from './interfaces';
import type { OfficeRuntimeSetupState } from '../office-runtime/interfaces';

export { createConversionCommand, sanitizeConvertedHtmlSource };

export async function createDefaultDesktopConversionRuntime(
  setupState: OfficeRuntimeSetupState
): Promise<DesktopConversionRuntime | null> {
  if (setupState.status !== 'ready') {
    return null;
  }

  const dependencies = await createDefaultOfficeRuntimeDependencies();

  return {
    executablePath: setupState.executablePath,
    process: dependencies.process,
  };
}

export async function ensureDesktopOdtSource(options: DesktopConversionOptions): Promise<void> {
  const runtime = requireDesktopRuntime(options.runtime);
  const conversionPaths = getDesktopConversionPaths(options.mapping);

  const localFolderPath = resolveLocalVaultPath(options.vaultAdapter, conversionPaths.folderPath);
  const conversionHtmlPath = getOdtConversionHtmlPath(conversionPaths.folderPath);
  const conversionOutputPath = getOdtConversionOutputPath(conversionPaths.folderPath);
  const localConversionHtmlPath = resolveLocalVaultPath(options.vaultAdapter, conversionHtmlPath);

  if (await options.vaultAdapter.exists(conversionPaths.odtPath)) {
    return;
  }

  const htmlSource = await options.vaultAdapter.read(conversionPaths.htmlPath);

  await options.vaultAdapter.write(conversionHtmlPath, createLibreOfficeHtmlDocument(htmlSource));
  await runConversionCommand(runtime, localConversionHtmlPath, localFolderPath, 'odt');

  if (!(await options.vaultAdapter.exists(conversionOutputPath))) {
    throw new Error('LibreOffice conversion failed.');
  }

  await options.vaultAdapter.rename(conversionOutputPath, conversionPaths.odtPath);
  await updateDesktopMapping(options, options.getCurrentTimestamp?.() ?? new Date().toISOString());
}

export async function openDesktopOdtSource(options: DesktopConversionOptions): Promise<void> {
  const runtime = requireDesktopRuntime(options.runtime);
  const conversionPaths = getDesktopConversionPaths(options.mapping);
  const localOdtPath = resolveLocalVaultPath(options.vaultAdapter, conversionPaths.odtPath);

  if (runtime.process.launchFile) {
    await runtime.process.launchFile(
      runtime.executablePath,
      [localOdtPath],
      DEFAULT_OPEN_TIMEOUT_MS
    );

    return;
  }

  void runtime.process.executeFile(runtime.executablePath, [localOdtPath], DEFAULT_OPEN_TIMEOUT_MS);
}

export async function detectOdtSaveEvent(
  options: OdtSaveDetectionOptions
): Promise<OdtSaveDetectionResult> {
  const currentOdtState = await createSourceSnapshot({
    path: options.mapping.odtPath,
    source: 'odt',
    vaultAdapter: options.vaultAdapter,
  });

  return {
    hasSavedOdtChange:
      options.mapping.sourceStates.odt !== null &&
      options.mapping.sourceStates.odt.exists &&
      currentOdtState.exists &&
      options.mapping.sourceStates.odt.contentHash !== currentOdtState.contentHash,
  };
}

export async function syncDesktopOdtSave(
  options: DesktopConversionOptions
): Promise<string | null> {
  const detectionResult = await detectOdtSaveEvent(options);

  if (!detectionResult.hasSavedOdtChange) {
    return null;
  }

  const runtime = requireDesktopRuntime(options.runtime);
  const conversionPaths = getDesktopConversionPaths(options.mapping);
  const localOdtPath = resolveLocalVaultPath(options.vaultAdapter, conversionPaths.odtPath);
  const localFolderPath = resolveLocalVaultPath(options.vaultAdapter, conversionPaths.folderPath);

  await assertValidOdtPackage(options, conversionPaths.odtPath);
  await runConversionCommand(runtime, localOdtPath, localFolderPath, 'html');

  const sanitizedHtmlSource = sanitizeConvertedHtmlSource(
    await options.vaultAdapter.read(conversionPaths.htmlPath)
  );

  const currentMarkdownSource = await options.vaultAdapter.read(options.mapping.markdownPath);

  const markdownMirrorSource = createMarkdownMirrorSource(
    currentMarkdownSource,
    sanitizedHtmlSource
  );

  const currentTimestamp = options.getCurrentTimestamp?.() ?? new Date().toISOString();

  await options.vaultAdapter.write(conversionPaths.htmlPath, sanitizedHtmlSource);
  await options.vaultAdapter.write(options.mapping.markdownPath, markdownMirrorSource);
  await updateDesktopMapping(options, currentTimestamp);

  return sanitizedHtmlSource;
}

async function assertValidOdtPackage(
  options: DesktopConversionOptions,
  odtPath: string
): Promise<void> {
  const odtSource = await options.vaultAdapter.read(odtPath);

  if (!odtSource.startsWith(ODT_PACKAGE_SIGNATURE) || !odtSource.includes(ODT_MIME_TYPE)) {
    throw new Error('LibreOffice conversion failed.');
  }
}
