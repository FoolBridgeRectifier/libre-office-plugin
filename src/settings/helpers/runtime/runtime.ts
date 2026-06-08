import { Platform } from 'obsidian';

import {
  getBundledOfficeRuntimeRootPath,
  getCurrentOfficeRuntimeOperatingSystem,
  getPluginManifestDirectory,
} from '../../../office-runtime/helpers/platform/platform';
import { detectOfficeRuntime } from '../../../office-runtime/officeRuntime';
import type { OfficeRuntimeSetupState } from '../../../office-runtime/interfaces';
import type { Plugin } from 'obsidian';

export function detectLibreNoteEditorOfficeRuntime(
  target: Plugin
): Promise<OfficeRuntimeSetupState> {
  return detectOfficeRuntime({
    bundledRootPath: getBundledOfficeRuntimeRootPath(
      getPluginManifestDirectory(target),
      target.app.vault.adapter
    ),
    operatingSystem: getCurrentOfficeRuntimeOperatingSystem(Platform),
    platform: Platform.isMobile ? 'mobile' : 'desktop',
  });
}
