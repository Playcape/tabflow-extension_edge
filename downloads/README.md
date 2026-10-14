# Current TabFlow browser packages

These archives are generated from the repository's `src/` by `scripts/package.ps1`. They contain the current Normal, Tonal and Aurora designs, compact workspace statistics, packed Collections and live Collection drop previews.

- [Chrome / Edge package](tabflow-2.0.0-chrome-edge.zip): download and extract into a folder, then choose **Load unpacked** on the browser's extensions page and select the extracted folder containing `manifest.json`.
- [Firefox / Zen package](tabflow-2.0.0-zen-firefox.zip): download and extract, then use **Load Temporary Add-on** in `about:debugging` and select its `manifest.json`. This is an unsigned temporary/development build.

When updating an existing unpacked installation, replace its files with the extracted package and reload the extension and TabFlow tab. Browser profile data belongs to the installed extension; update that installation in place if you want to retain it.

The `V1.1` release shown elsewhere on GitHub is an older product version. Use these packages or the current source tree for this redesign. [Full installation instructions](../docs/installation.md).

Packaging refreshes both `dist/` for local use and these downloadable archives. Include the updated archives whenever publishing source changes that affect a browser build.
