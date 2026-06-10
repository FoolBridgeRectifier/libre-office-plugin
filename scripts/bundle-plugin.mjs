import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const DIST_DIRECTORY = 'dist';
const PLUGIN_ENTRY_FILES = ['main.js', 'manifest.json', 'THIRD_PARTY_NOTICES.md'];

const distPath = path.resolve(DIST_DIRECTORY);

await rm(distPath, { force: true, recursive: true });
await mkdir(distPath, { recursive: true });

await copyPluginEntryFiles();

console.log(`Bundled plugin build into ${DIST_DIRECTORY}/`);

async function copyPluginEntryFiles() {
  await Promise.all(
    PLUGIN_ENTRY_FILES.map((fileName) => cp(path.resolve(fileName), path.join(distPath, fileName)))
  );
}
