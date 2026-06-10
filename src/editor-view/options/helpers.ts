import type { App, TAbstractFile, TFile, WorkspaceLeaf } from 'obsidian';
import type { ElectronRuntime, SearchPluginApp, SearchView } from './interfaces';

export function openTagSearch(app: App, tagText: string): void {
  const tagQuery = tagText.startsWith('#') ? tagText.slice(1) : tagText;
  const searchQuery = `tag:${tagQuery}`;
  const searchPlugin = (app as SearchPluginApp).internalPlugins?.getPluginById('global-search');

  searchPlugin?.instance?.openGlobalSearch?.(searchQuery);
  setSearchViewQuery(app, searchQuery);
}

export async function openInternalLinkTarget(
  app: App,
  target: string,
  sourcePath: string
): Promise<void> {
  const destinationFile = resolveInternalLinkTargetFile(app, target, sourcePath);

  if (!destinationFile) {
    return;
  }

  await app.workspace.getLeaf(false).openFile(destinationFile);
}

export async function openExternalUrl(
  url: string,
  electronRequire: NodeJS.Require = require,
  browserOpen: typeof globalThis.open = globalThis.open
): Promise<void> {
  const electronShell = getElectronShell(electronRequire);

  if (electronShell?.openExternal) {
    await electronShell.openExternal(url);

    return;
  }

  browserOpen(url, '_blank', 'noopener,noreferrer');
}

function getElectronShell(
  electronRequire: NodeJS.Require
): Partial<ElectronRuntime['shell']> | null {
  try {
    const electronRuntime = electronRequire('electron') as ElectronRuntime;

    return electronRuntime.shell ?? null;
  } catch {
    return null;
  }
}

function setSearchViewQuery(app: App, searchQuery: string): void {
  const searchLeaf = app.workspace.getLeavesOfType('search')[0];
  const searchView = searchLeaf?.view as Partial<SearchView> | undefined;

  searchView?.setQuery?.(searchQuery);
  revealSearchLeaf(app, searchLeaf);
}

function revealSearchLeaf(app: App, searchLeaf: WorkspaceLeaf | undefined): void {
  if (!searchLeaf) {
    return;
  }

  void app.workspace.revealLeaf(searchLeaf);
}

function resolveInternalLinkTargetFile(app: App, target: string, sourcePath: string): TFile | null {
  const targetPath = target.split('#')[0]?.trim() || sourcePath;
  const linkedFile =
    app.metadataCache.getFirstLinkpathDest(targetPath, sourcePath) ??
    app.vault.getAbstractFileByPath(targetPath);

  return isMarkdownFile(linkedFile) ? linkedFile : null;
}

function isMarkdownFile(file: TAbstractFile | null): file is TFile {
  return Boolean(file && 'extension' in file && (file as TFile).extension === 'md');
}
