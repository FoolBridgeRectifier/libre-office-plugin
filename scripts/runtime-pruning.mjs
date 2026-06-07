import { readdir, rm } from 'node:fs/promises';
import path from 'node:path';

export async function prunePreparedRuntime(targetPath, platform) {
  await pruneGeneratedRuntimeFiles(targetPath);

  if (!platform.startsWith('macos')) {
    return;
  }

  await Promise.all([
    rm(path.join(targetPath, 'Contents/MacOS/urelibs'), { force: true, recursive: true }),
    rm(path.join(targetPath, 'Contents/Frameworks/LibreOfficePython.framework/Versions/Current'), {
      force: true,
      recursive: true,
    }),
    rm(
      path.join(
        targetPath,
        'Contents/Frameworks/LibreOfficePython.framework/Versions/3.12/lib/python3.12'
      ),
      { force: true, recursive: true }
    ),
  ]);
}

async function pruneGeneratedRuntimeFiles(directoryPath) {
  const directoryEntries = await readdir(directoryPath, { withFileTypes: true });

  await Promise.all(
    directoryEntries.map(async (directoryEntry) => {
      const entryPath = path.join(directoryPath, directoryEntry.name);

      if (directoryEntry.isDirectory()) {
        await pruneGeneratedRuntimeDirectory(entryPath, directoryEntry.name);

        return;
      }

      if (isGeneratedRuntimeFile(directoryEntry.name)) {
        await rm(entryPath, { force: true });
      }
    })
  );
}

async function pruneGeneratedRuntimeDirectory(entryPath, directoryName) {
  if (directoryName === '__pycache__' || isGeneratedRuntimeLogDirectory(entryPath)) {
    await rm(entryPath, { force: true, recursive: true });

    return;
  }

  await pruneGeneratedRuntimeFiles(entryPath);
}

function isGeneratedRuntimeLogDirectory(entryPath) {
  return (
    path.basename(entryPath) === 'logs' && path.basename(path.dirname(entryPath)) === 'program'
  );
}

function isGeneratedRuntimeFile(fileName) {
  return fileName.endsWith('.pyc') || fileName.endsWith('.pyo') || fileName.endsWith('.dmp');
}
