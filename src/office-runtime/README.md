# Office Runtime Module

## What It Does

`office-runtime` detects and validates the bundled local LibreOffice runtime used for desktop ODT conversion.

It isolates platform detection, filesystem/process dependencies, executable validation, setup-state messaging, and Node-specific runtime access.

## Main Components

- `officeRuntime.ts` performs high-level detection: skip mobile, reject unsupported operating systems, build bundled candidates, validate them, and return setup state.
- `interfaces.ts` defines runtime candidates, dependency contracts, process execution results, platform flags, operating system/platform unions, setup states, and validation results.
- `constants.ts` defines validation timeout, LibreOffice version arguments, and expected bundled executable paths per operating system.
- `helpers.ts` builds bundled candidate paths from the runtime root.
- `platform/platform.ts` maps Obsidian `Platform` flags and plugin manifest directory into runtime detection inputs.
- `node-runtime/nodeRuntime.ts` creates default Node filesystem/process dependencies using `fs/promises` and `child_process`.
- `setup-state/setupState.ts` creates ready, missing, skipped-mobile, and unsupported setup-state messages.
- `validation/validation.ts` validates candidate executable paths and runs `--version`.
- `validation/helpers.ts` extracts version text and rejects unsafe executable paths.
- `test-runtime/testRuntime.ts` provides mock dependencies for office-runtime tests.

## How It Is Used

`settings/runtime` calls `detectOfficeRuntime` during plugin load. `conversion` turns a ready setup state into a desktop conversion runtime. UI status components display the setup-state message so desktop ODT availability is visible.
