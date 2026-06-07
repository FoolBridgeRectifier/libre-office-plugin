# Third-Party Notices

Libre Note Editor bundles LibreOffice runtime packages for desktop ODT conversion.
LibreOffice is not bundled to provide an endorsed or branded LibreOffice product; it is
used as a headless conversion runtime inside this Obsidian plugin.

## LibreOffice

Bundled runtime version: LibreOffice 26.2.1.2.

Bundled runtime folders:

- `runtime/LibreOffice` for Windows
- `runtime/LibreOffice.app` for macOS Intel
- `runtime/LibreOffice-aarch64.app` for macOS Apple Silicon
- `runtime/LibreOffice-linux` for Linux

LibreOffice is made available under the Mozilla Public License, version 2.0.
The bundled runtime folders also include LibreOffice's own third-party notices,
copyright statements, extension licenses, and credits.

Important bundled license and notice files:

- Windows: `runtime/LibreOffice/license.txt`, `runtime/LibreOffice/LICENSE.html`,
  `runtime/LibreOffice/NOTICE`, `runtime/LibreOffice/CREDITS.fodt`
- macOS Intel: `runtime/LibreOffice.app/Contents/Resources/LICENSE`,
  `runtime/LibreOffice.app/Contents/Resources/LICENSE.html`,
  `runtime/LibreOffice.app/Contents/Resources/NOTICE`,
  `runtime/LibreOffice.app/Contents/Resources/CREDITS.fodt`
- macOS Apple Silicon: `runtime/LibreOffice-aarch64.app/Contents/Resources/LICENSE`,
  `runtime/LibreOffice-aarch64.app/Contents/Resources/LICENSE.html`,
  `runtime/LibreOffice-aarch64.app/Contents/Resources/NOTICE`,
  `runtime/LibreOffice-aarch64.app/Contents/Resources/CREDITS.fodt`
- Linux: `runtime/LibreOffice-linux/LICENSE`,
  `runtime/LibreOffice-linux/LICENSE.html`, `runtime/LibreOffice-linux/NOTICE`,
  `runtime/LibreOffice-linux/CREDITS.fodt`

The runtime preparation step removes generated caches, crash dumps, runtime logs,
and macOS Python scripting payloads that are not needed for headless ODT conversion.
It does not change LibreOffice source code.

LibreOffice source code and release downloads are available from The Document
Foundation:

- https://www.libreoffice.org/download/download-libreoffice/
- https://downloadarchive.documentfoundation.org/libreoffice/old/26.2.1.2/

LibreOffice and The Document Foundation names and marks belong to their respective
owners. Do not present this plugin as endorsed by, sponsored by, or affiliated with
The Document Foundation.
