import { access, cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const RUNTIME_LAYOUTS = {
  linux: {
    candidates: ['libreoffice', 'LibreOffice'],
    executablePath: 'program/soffice',
    targetDirectoryName: 'libreoffice',
  },
  macos: {
    candidates: ['LibreOffice.app'],
    executablePath: 'Contents/MacOS/soffice',
    targetDirectoryName: 'LibreOffice.app',
  },
  windows: {
    candidates: ['App/libreoffice', 'libreoffice', 'LibreOffice'],
    executablePath: 'program/soffice.com',
    targetDirectoryName: 'LibreOffice',
  },
};

const parsedArguments = parseArguments(process.argv.slice(2));
const layout = RUNTIME_LAYOUTS[parsedArguments.platform];

if (!layout) {
  fail('Use --platform windows, --platform macos, or --platform linux.');
}

if (!parsedArguments.sourcePath) {
  fail('Use --source <extracted LibreOffice runtime folder>.');
}

const runtimeRootPath = path.resolve(parsedArguments.runtimeRootPath ?? 'runtime');
const sourceRootPath = path.resolve(parsedArguments.sourcePath);
const runtimeSourcePath = await findRuntimeSourcePath(sourceRootPath, layout);
const targetPath = path.join(runtimeRootPath, layout.targetDirectoryName);
const targetExecutablePath = path.join(targetPath, layout.executablePath);

await rm(targetPath, { force: true, recursive: true });
await mkdir(runtimeRootPath, { recursive: true });
await cp(runtimeSourcePath, targetPath, { recursive: true });
await assertPathExists(targetExecutablePath);

console.log(`Prepared ${parsedArguments.platform} runtime at ${targetExecutablePath}`);

function parseArguments(argumentList) {
  const parsedValues = {};

  for (let argumentIndex = 0; argumentIndex < argumentList.length; argumentIndex += 1) {
    const argumentName = argumentList[argumentIndex];
    const argumentValue = argumentList[argumentIndex + 1];

    if (argumentName === '--platform') {
      parsedValues.platform = argumentValue;
      argumentIndex += 1;
    } else if (argumentName === '--source') {
      parsedValues.sourcePath = argumentValue;
      argumentIndex += 1;
    } else if (argumentName === '--runtime-root') {
      parsedValues.runtimeRootPath = argumentValue;
      argumentIndex += 1;
    }
  }

  return parsedValues;
}

async function findRuntimeSourcePath(sourceRootPath, layout) {
  if (await pathExists(path.join(sourceRootPath, layout.executablePath))) {
    return sourceRootPath;
  }

  for (const candidatePath of layout.candidates) {
    const absoluteCandidatePath = path.join(sourceRootPath, candidatePath);

    if (await pathExists(path.join(absoluteCandidatePath, layout.executablePath))) {
      return absoluteCandidatePath;
    }
  }

  fail(`Could not find ${layout.executablePath} under ${sourceRootPath}.`);
}

async function pathExists(filePath) {
  try {
    await access(filePath);

    return true;
  } catch {
    return false;
  }
}

async function assertPathExists(filePath) {
  if (!(await pathExists(filePath))) {
    fail(`Prepared runtime is missing ${filePath}.`);
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
