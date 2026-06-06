import type { Plugin } from 'obsidian';

import type { OfficeRuntimeOperatingSystem, OfficeRuntimePlatformFlags } from '../../interfaces';

export function getBundledOfficeRuntimeRootPath(pluginDirectory: string | null): string | null {
  return pluginDirectory ? `${pluginDirectory}/runtime` : null;
}

export function getCurrentOfficeRuntimeOperatingSystem(
  platform: OfficeRuntimePlatformFlags
): OfficeRuntimeOperatingSystem {
  if (platform.isWin) {
    return 'windows';
  }

  if (platform.isMacOS) {
    return 'macos';
  }

  return platform.isLinux ? 'linux' : 'unsupported';
}

export function getPluginManifestDirectory(plugin: Plugin): string | null {
  const manifest = plugin.manifest as { readonly dir?: string } | undefined;

  return manifest?.dir ?? null;
}
