import type { TFile } from 'obsidian';

export function createFile(path: string, extension: string): TFile {
  return {
    basename: path.replace(/\.[^.]+$/, ''),
    extension,
    name: path.split('/').pop() ?? path,
    path,
  } as TFile;
}

export function createMarkdownFile(path: string): TFile {
  return createFile(path, 'md');
}
