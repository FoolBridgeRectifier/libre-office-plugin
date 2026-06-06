import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';

const DIST_DIRECTORY = 'dist';
const RUNTIME_DIRECTORY = 'runtime';
const PLUGIN_ENTRY_FILES = ['main.js', 'manifest.json'];
const RUNTIME_DOCUMENTATION_FILES = ['README.md'];
const RUNTIME_PLACEHOLDER_FILES = ['.gitkeep'];

const distPath = path.resolve(DIST_DIRECTORY);
const distRuntimePath = path.join(distPath, RUNTIME_DIRECTORY);
const runtimePath = path.resolve(RUNTIME_DIRECTORY);

await rm(distPath, { force: true, recursive: true });
await mkdir(distRuntimePath, { recursive: true });

await copyPluginEntryFiles();
await copyRuntimeDocumentation();
await copyPreparedRuntimeDirectories();

console.log(`Bundled plugin build into ${DIST_DIRECTORY}/`);

async function copyPluginEntryFiles() {
  for (const fileName of PLUGIN_ENTRY_FILES) {
    await cp(path.resolve(fileName), path.join(distPath, fileName));
  }
}

async function copyRuntimeDocumentation() {
  for (const fileName of RUNTIME_DOCUMENTATION_FILES) {
    await cp(path.join(runtimePath, fileName), path.join(distRuntimePath, fileName));
  }
}

async function copyPreparedRuntimeDirectories() {
  const preparedRuntimeNames = await getPreparedRuntimeNames();

  if (preparedRuntimeNames.length === 0) {
    fail('No prepared runtime directories were found under runtime/.');
  }

  for (const runtimeName of preparedRuntimeNames) {
    await cp(path.join(runtimePath, runtimeName), path.join(distRuntimePath, runtimeName), {
      recursive: true,
    });
  }
}

async function getPreparedRuntimeNames() {
  const directoryEntries = await readdir(runtimePath, { withFileTypes: true });
  const runtimeNames = [];

  for (const directoryEntry of directoryEntries) {
    if (shouldSkipRuntimeEntry(directoryEntry.name)) {
      continue;
    }

    const entryPath = path.join(runtimePath, directoryEntry.name);

    if (directoryEntry.isDirectory() && (await hasRuntimeFiles(entryPath))) {
      runtimeNames.push(directoryEntry.name);
    }
  }

  return runtimeNames;
}

function shouldSkipRuntimeEntry(entryName) {
  return (
    RUNTIME_DOCUMENTATION_FILES.includes(entryName) || RUNTIME_PLACEHOLDER_FILES.includes(entryName)
  );
}

async function hasRuntimeFiles(directoryPath) {
  const directoryEntries = await readdir(directoryPath);

  for (const directoryEntry of directoryEntries) {
    const entryPath = path.join(directoryPath, directoryEntry);
    const entryStat = await stat(entryPath);

    if (entryStat.isDirectory() || entryStat.isFile()) {
      return true;
    }
  }

  return false;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
