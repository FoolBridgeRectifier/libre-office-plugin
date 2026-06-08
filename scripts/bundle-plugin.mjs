import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';

const DIST_DIRECTORY = 'dist';
const RUNTIME_DIRECTORY = 'runtime';
const PLUGIN_ENTRY_FILES = ['main.js', 'manifest.json', 'THIRD_PARTY_NOTICES.md'];
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
  await Promise.all(
    PLUGIN_ENTRY_FILES.map((fileName) => cp(path.resolve(fileName), path.join(distPath, fileName)))
  );
}

async function copyRuntimeDocumentation() {
  await Promise.all(
    RUNTIME_DOCUMENTATION_FILES.map((fileName) =>
      cp(path.join(runtimePath, fileName), path.join(distRuntimePath, fileName))
    )
  );
}

async function copyPreparedRuntimeDirectories() {
  const preparedRuntimeNames = await getPreparedRuntimeNames();

  if (preparedRuntimeNames.length === 0) {
    fail('No prepared runtime directories were found under runtime/.');
  }

  await Promise.all(
    preparedRuntimeNames.map((runtimeName) =>
      cp(path.join(runtimePath, runtimeName), path.join(distRuntimePath, runtimeName), {
        recursive: true,
      })
    )
  );
}

async function getPreparedRuntimeNames() {
  const directoryEntries = await readdir(runtimePath, { withFileTypes: true });

  const runtimeNames = await Promise.all(directoryEntries.map(getPreparedRuntimeName));

  return runtimeNames.filter(Boolean);
}

async function getPreparedRuntimeName(directoryEntry) {
  if (shouldSkipRuntimeEntry(directoryEntry.name) || !directoryEntry.isDirectory()) {
    return null;
  }

  const entryPath = path.join(runtimePath, directoryEntry.name);

  return (await hasRuntimeFiles(entryPath)) ? directoryEntry.name : null;
}

function shouldSkipRuntimeEntry(entryName) {
  return (
    RUNTIME_DOCUMENTATION_FILES.includes(entryName) || RUNTIME_PLACEHOLDER_FILES.includes(entryName)
  );
}

async function hasRuntimeFiles(directoryPath) {
  const directoryEntries = await readdir(directoryPath);
  const entryStats = await Promise.all(
    directoryEntries.map((directoryEntry) => stat(path.join(directoryPath, directoryEntry)))
  );

  return entryStats.some((entryStat) => entryStat.isDirectory() || entryStat.isFile());
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
