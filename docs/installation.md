# Install and update TabFlow

## Download the current build

The current installable archives are in [downloads](../downloads/README.md): [Chrome / Edge](https://github.com/Playcape/tabflow-extension_edge/raw/refs/heads/main/downloads/tabflow-2.0.0-chrome-edge.zip) and [Firefox / Zen](https://github.com/Playcape/tabflow-extension_edge/raw/refs/heads/main/downloads/tabflow-2.0.0-zen-firefox.zip). Extract the matching archive and load the folder containing its `manifest.json` as described below. The older `V1.1` GitHub release does not contain the redesigned UI.

TabFlow uses one source codebase with two browser-specific Manifest V3 packages. There is no application build step. Run the packaging script when you need the Firefox/Zen manifest or distribution archives.

## Build the browser packages

From the repository root in PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/package.ps1
```

The script recreates `dist/` from `src/`; keep your own files outside that generated folder.

| Output | Use |
| --- | --- |
| `dist/chromium/` | Unpacked Chrome / Edge installation |
| `dist/tabflow-<version>-chrome-edge.zip` | Chromium distribution archive |
| `dist/zen/` | Temporary Firefox / Zen installation |
| `dist/tabflow-<version>-zen-firefox.zip` | Firefox / Zen signing or distribution input |

The version comes from `src/manifest.json`. Packaging changes the manifest, not your workspace data.

## Chrome and Microsoft Edge

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select `dist/chromium/`. For source development, `src/` is also usable.
4. Pin the TabFlow toolbar action if you want quick access, then open a new tab.

The source manifest is Chromium-native. Its Gecko metadata is for packaging; the Chromium distribution removes it. Keep the installed folder in a stable location, since the browser loads directly from that folder.

## Firefox

1. Build the packages above.
2. Open `about:debugging#/runtime/this-firefox`.
3. Choose **Load Temporary Add-on** and select `dist/zen/manifest.json`.
4. Open a new tab. If Firefox asks whether to keep the extension's new-tab change, accept it.

Use `dist/zen/`, not raw `src/`: packaging replaces the service-worker background with a module event-page script, removes the Chromium favicon permission, and adds the declarative new-tab override.

Temporary add-ons are removed when Firefox restarts. Use them for development and export important data before changing installation methods. See [Mozilla's temporary-install workflow](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Your_first_WebExtension#installing).

## Zen

Install the same `dist/zen/` build through `about:debugging#/runtime/this-firefox`.

If the New Tab button opens Zen's floating address bar instead of a page, open `about:config`, search for **`zen.urlbar.replace-newtab`**, and set it to **`false`**. This enables a new-tab surface for TabFlow to replace. The setting is relevant when this Zen behavior is enabled; it is not required for ordinary Firefox. See [Zen's URL-bar documentation](https://docs.zen-browser.app/user-manual/urlbar) and [advanced preferences](https://docs.zen-browser.app/guides/about-config-flags).

Alternatively, keep Zen's URL-bar behavior and open TabFlow through its toolbar action. The homepage URL shown under **Settings → Data** can also be copied into browser settings where supported. Zen's own workspaces and TabFlow's Spaces are independent.

## Permanent Firefox / Zen distribution

For a lasting Firefox release installation, use a signed extension. Mozilla supports both public AMO listings and unlisted self-distribution; signing and review rules are described in the [Firefox Extension Workshop](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/).

For your own build:

1. Submit `dist/tabflow-<version>-zen-firefox.zip` through the [AMO Developer Hub](https://addons.mozilla.org/developers/), selecting self-distribution if you do not want a public listing.
2. Complete the signing process and download the signed `.xpi`.
3. Install it through the add-on manager's **Install Add-on From File** command.

Use the signed Firefox-compatible package for Zen as well, subject to that browser's current installation policy. Generating a zip does not sign or publish it. Do not depend on an unsigned-install preference as a permanent release distribution mechanism.

## How new tabs work

### Chromium: redirect and reuse

The Chromium manifest intentionally has no `chrome_url_overrides`. Background tab listeners recognize browser new-tab URLs such as `chrome://newtab/` and `edge://newtab/`, then navigate those tabs to `newtab/newtab.html` inside the extension.

This makes TabFlow an ordinary extension page, including an ordinary page icon where the browser displays one. The background also keeps one TabFlow workspace per window. Opening another new tab in that window can focus the existing workspace and remove the redundant tab. A new window can still have its own workspace.

Only recognized new-tab/workspace URLs participate. An unrelated blank tab, an external website, or a separate Page viewer is not a TabFlow workspace duplicate. New-tab redirection is event-driven, so behavior can be affected by browser policies and other new-tab extensions.

### Firefox / Zen: declarative override and reuse

The generated manifest declares:

```json
"chrome_url_overrides": { "newtab": "newtab/newtab.html" }
```

The shared background skips Chromium's privileged-URL redirect. It can still reuse duplicate TabFlow workspace tabs once they resolve to the extension page. Firefox-based new-tab pages do not necessarily display favicons like ordinary extension pages; TabFlow does not force that browser UI behavior.

The browser-toolbar action is separate from per-window deduplication: it searches for an existing TabFlow workspace across windows and focuses it, or opens one if needed. Reusing a workspace asks the page to focus its search launcher.

## Permissions

The manifest requests capabilities used by the product:

| Permission | Purpose |
| --- | --- |
| `tabs` | Show/focus live tabs, capture links, open Collections, and handle new-tab lifecycle |
| `storage` | Save workspace metadata, settings, and snapshots locally |
| `sessions` | List and restore recently closed tabs where supported |
| `bookmarks` | Read folders for the user-triggered bookmark import |
| `favicon` | Chromium's local favicon endpoint; removed from the Firefox/Zen package |

There is no TabFlow account or cloud-sync permission. Remote resources used by saved favicons, Pages, custom CSS, or opened websites are described in the [privacy section](../README.md#privacy-by-design-with-explicit-boundaries).

## Update without losing your workspace

Export a JSON backup before updating. Replace files in the **same installed folder**, reload the extension from the browser's extension manager, and reopen existing TabFlow pages so they use the current code.

Workspace data belongs to the browser profile and extension identity, not the source directory. Updating an existing installation normally keeps it; uninstalling, changing identity/profile, clearing browser data, or moving between temporary and signed installations may not. Backups are the portable recovery route.

When TabFlow finds an older `tabflow_v2` record and no current workspace, it migrates that record to schema 3. Ordinary migration retains the old record; an explicit **Clear All** removes legacy records as well. This only applies if the new installation can access the old extension's storage.

To switch browsers, export in the old browser and import through **Settings → Data** in the new browser. Import replaces the destination workspace. [Backup scope and snapshot differences](user-guide.md#backups-snapshots-and-moving-data).
