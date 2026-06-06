# Bundled LibreOffice Runtime

Libre Note Editor expects desktop ODT conversion to use a LibreOffice runtime bundled inside this plugin directory, not a user-installed system LibreOffice.

Place the platform runtime here:

```text
runtime/
|-- LibreOffice/program/soffice.com          # Windows
|-- LibreOffice.app/Contents/MacOS/soffice   # macOS
`-- libreoffice/program/soffice              # Linux
```

The runtime payload is intentionally ignored by Git because LibreOffice is large and platform-specific. Prepare every platform runtime you want to ship before release.

`npm run build` copies `main.js`, `manifest.json`, and every prepared runtime directory into `dist/`. If Windows, macOS, and Linux runtime folders are present, all three are bundled in `dist/runtime/`.

Use the runtime preparation script after extracting a platform LibreOffice package:

```sh
npm run runtime:prepare -- --platform windows --source output/runtime-extract/LibreOfficePortable
npm run runtime:prepare -- --platform macos --source output/runtime-extract
npm run runtime:prepare -- --platform linux --source output/runtime-extract
```

Windows packages should come from LibreOffice Portable for PortableApps. macOS packages should provide `LibreOffice.app`. Linux packages should provide a portable LibreOffice folder with `program/soffice`.
