# Plan 11: Desktop LibreOffice Runtime

## Goal

Detect a local LibreOffice runtime on desktop and expose setup state without requiring it on mobile.

## Implement

- Add `src/office-runtime/`.
- Detect the bundled LibreOffice runtime inside the plugin `runtime/` folder.
- Do not use configured, system, or user-installed LibreOffice paths for desktop conversion.
- Validate the runtime can be executed for version or conversion checks.
- Store setup state for the UI.
- Keep mobile HTML editing functional when LibreOffice is missing.
- Do not execute macros.

## Tests

- Mock configured, bundled, system, missing, and invalid LibreOffice paths.
- Test path validation rejects unsafe or nonexistent paths.
- Test mobile mode skips LibreOffice requirement.
- Test setup state messages.
- Test runtime detection has no module-load side effects.

## MCP Verification

- Reload the plugin on desktop.
- Verify in MCP:
  - Runtime state is visible in settings or status UI.
- Missing bundled LibreOffice shows setup state and does not break HTML editing.
- Adding the bundled runtime payload updates state after reload.
  - Mobile or HTML fallback mode never prompts as blocking.
  - No remote service is contacted.

## Edge Cases

- Bundled LibreOffice path contains spaces.
- Bundled path points to a directory instead of executable.
- Executable exists but fails to launch.
- Portable LibreOffice payload inside the plugin folder.
- Multiple bundled executable candidates.
- Unsupported operating system.
- Permission denied.
- Detection timeout.

## Done When

- Desktop setup state is reliable and mobile remains independent.
- All local checks pass.
