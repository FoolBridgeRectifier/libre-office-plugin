import { collectObsidianLinkWarnings } from '../warnings/warnings';
import type { App, TFile } from 'obsidian';
import type { ObsidianLinkTargetCache, ObsidianLinkWarning } from '../../interfaces';

function resolveObsidianLinkTarget(
  app: App,
  markdownPath: string,
  targetPath: string
): ObsidianLinkTargetCache | null {
  const targetFile =
    targetPath.trim() === ''
      ? app.vault.getAbstractFileByPath(markdownPath)
      : app.metadataCache.getFirstLinkpathDest(targetPath, markdownPath);

  if (!targetFile || !('path' in targetFile)) {
    return null;
  }

  const targetCache = app.metadataCache.getFileCache(targetFile as TFile);

  return {
    blockIds: Object.keys(targetCache?.blocks ?? {}),
    headings: (targetCache?.headings ?? []).map((heading) => heading.heading),
  };
}

export function collectObsidianLinkWarningsForApp(
  app: App,
  markdownPath: string,
  htmlSource: string
): ReadonlyArray<ObsidianLinkWarning> {
  return collectObsidianLinkWarnings(htmlSource, {
    resolveTarget: (targetPath) => resolveObsidianLinkTarget(app, markdownPath, targetPath),
  });
}
