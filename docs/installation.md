# Installing TabFlow

TabFlow runs on **Microsoft Edge, Google Chrome, Firefox, and Zen Browser**
from a single codebase. Two ways to get it:

- **Development:** load the `src/` folder directly (works everywhere, may show
  harmless manifest notes).
- **Clean packages:** run `scripts/package.ps1` to build browser-specific
  packages without any warnings:

  | Output | For |
  | --- | --- |
  | `dist/chromium` + `tabflow-<v>-chrome-edge.zip` | Edge, Chrome |
  | `dist/zen` + `tabflow-<v>-zen-firefox.zip` | Zen, Firefox |

  ```powershell
  powershell -ExecutionPolicy Bypass -File scripts/package.ps1
  ```

## Microsoft Edge

1. Open `edge://extensions`
2. Enable **Developer mode** (left sidebar)
3. **Load unpacked** → select `dist/chromium` (or `src/`)
4. Open a new tab — TabFlow appears.

## Google Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. **Load unpacked** → select `dist/chromium` (or `src/`)
4. Open a new tab — Chrome asks once whether to keep the new tab page; keep it.

## Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. **Load Temporary Add-on…** → select `dist/zen/manifest.json`
3. Open a new tab — Firefox shows a one-time "Keep changes?" bar; accept it.

> Temporary add-ons unload when Firefox restarts — see *Permanent installs* below.

## Zen Browser

Zen is Firefox-based, so the install is the same — **plus one required setting**:

1. `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on…** →
   select `dist/zen/manifest.json`
2. **Required:** open `about:config`, search **`zen.urlbar.replace-newtab`**,
   set it to **`false`**.

   Why: Zen ships with "URL bar replaces new tab" enabled — pressing Ctrl+T
   opens a floating search popup and *never creates a new-tab page at all*,
   so no extension's new tab page can appear. Setting the pref to `false`
   restores real new tabs, which then show TabFlow.
3. Open a new tab and accept the "Keep changes?" prompt.

Notes for Zen:

- **"Background script: Stopped"** in about:debugging is normal — it wakes on
  demand (hotkeys, omnibox, toolbar button).
- Zen's own *workspaces* and TabFlow's *Spaces* are independent features and
  coexist fine.
- Alternative to the pref change: leave Zen's popup enabled and reach TabFlow
  via the **toolbar button** or by setting the TabFlow URL as your
  **homepage** (Settings → Data → Homepage → Copy URL).

## Permanent installs on Firefox/Zen

Release Firefox and Zen enforce extension signing; the
`xpinstall.signatures.required` override does **not** work there. To install
permanently:

1. Create a free account at [addons.mozilla.org](https://addons.mozilla.org/developers/)
2. Submit `tabflow-<v>-zen-firefox.zip` as **unlisted (self-distribution)** —
   it is not published in the store, you just receive a **signed `.xpi`**
3. Install the signed `.xpi` via `about:addons` → gear icon →
   *Install Add-on From File…*

Edge/Chrome unpacked installs are already permanent (they persist across
restarts as long as the folder stays in place).

## Moving your data between browsers

Data is stored per browser profile, so use a backup file to move it:

1. Old browser: TabFlow → **Settings → Data → Export JSON**
2. New browser: TabFlow → **Settings → Data → Import JSON** → pick the file → confirm

Everything moves: spaces, collections, saved tabs, pins, notes, tags, hotkey
slots, links, tasks, and appearance settings. Backups from TabFlow v1 are
converted automatically.

## Updating

- Unpacked/temporary installs: replace the folder contents, then click
  **Reload** on the browser's extension page. Your data is untouched — it
  lives in the browser profile, not in the extension folder.
- Coming from TabFlow v1: just install v2 over it; on first launch your v1
  data is migrated automatically (the old record is kept as a fallback).
