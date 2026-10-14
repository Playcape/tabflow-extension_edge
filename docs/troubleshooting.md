# Troubleshooting TabFlow

Start by checking the installed browser build and reloading TabFlow after an extension update. Export a JSON backup before resetting, reinstalling, or changing browser profiles.

## A new tab does not open TabFlow

**Chrome / Edge:** confirm TabFlow is enabled on the extensions page and inspect background/service-worker errors. The current Chromium implementation redirects recognized new-tab URLs; it does not register a declarative new-tab override. Another extension or browser policy may change the URL before TabFlow sees it. Temporarily disable a competing new-tab extension to isolate that interaction. Try the TabFlow toolbar action.

**Firefox / Zen:** load the generated **`dist/zen/manifest.json`**. Raw `src/` has the wrong background configuration for this package. Check whether the browser accepted the extension's new-tab override.

**Zen's floating URL bar:** if no new-tab page is created, TabFlow has no surface to replace. Set `zen.urlbar.replace-newtab` to `false` in `about:config`, or open TabFlow through the toolbar action. See [Zen setup](installation.md#zen).

## A new tab returns to an existing workspace

This is expected. TabFlow reuses its workspace within the same window and requests focus for its search launcher. A new window can have another workspace. The toolbar action can focus a workspace in another window.

Separate Pages opened in a viewer tab are not workspace duplicates. If unrelated tabs are closed or redirected, report the exact URL, whether the tab was created by a link or Ctrl+T, and the browser/version.

## The tab-strip icon differs between browsers

Chromium loads an ordinary extension page after redirection. Firefox/Zen use a declarative new-tab override, and browser new-tab surfaces may display a generic icon. A missing favicon there does not mean the workspace failed to load. Reload the extension if the toolbar still shows an old icon.

## The Firefox / Zen add-on disappears after restart

An add-on loaded through `about:debugging` is temporary. Use a signed package for a lasting installation; see [permanent distribution](installation.md#permanent-firefox--zen-distribution). Export before changing installation method rather than assuming temporary-install storage will survive every browser lifecycle.

## “Background script: Stopped” or manifest warnings

An idle event background can stop until an event wakes it. An inactive background alone is not an error; check whether the toolbar or assigned shortcut wakes it successfully.

A `favicon` permission warning in Firefox usually indicates the raw Chromium source manifest was loaded. Rebuild and use `dist/zen/`. Errors mentioning a missing background script, failed imports, or missing files are different: inspect the package, keep its directory structure intact, and rebuild with `scripts/package.ps1`.

## A Page is blank or behaves differently from a website

- **Embedded website:** the site can block framing with its own security policy. Use **Open in new browser tab**. Authentication, cookies, popups, or embedded scripts may also behave differently in a sandbox.
- **Uploaded HTML:** TabFlow copies the selected file's text, not its adjacent images, scripts, or stylesheets. Use self-contained HTML or explicit resource URLs.
- **Scripts:** Chrome/Edge use a separate sandbox renderer, with inline script execution verified in Edge. Firefox/Zen use sandboxed `srcdoc`, where the extension CSP may block inline scripts. Neither approach promises that every standalone web app will run unchanged.
- **Form changes disappeared:** editable viewer state is not guaranteed to persist. Save document changes through **Edit Page**.
- **Missing content after copying storage:** large Page bodies live in IndexedDB. Use **Export JSON** rather than copying only the main storage key.

TabFlow's Page sandbox isolates a document from the parent workspace; it does not prevent every network request made by that document. See [Pages](user-guide.md#pages-and-page-spaces).

## Search or a drag does not do what I expected

Saved-tab search covers titles, URLs, and tags, not Page bodies or notes. The command palette also finds Page and Page Space metadata. Plain text entered in TabFlow's search field stays a local filter; Enter launches a recognizable URL or exact Links alias.

Clear the search filter before rearranging cards. Use grips for Collection and Space reordering. Card edges insert; the middle swaps. In List view, these zones run vertically. Session capture saves web links and does not close the source tabs.

## Hotkeys or `to` aliases do not trigger

Make sure a saved tab owns the hotkey slot. Shortcuts can conflict with browser/OS bindings or another extension. Remap them at `edge://extensions/shortcuts` or `chrome://extensions/shortcuts`; in Firefox/Zen use the add-on manager's **Manage Extension Shortcuts** command.

For aliases, type `to`, a space, then the name in the **browser address bar**. Enable **Show Links in sidebar** under Advanced settings to create or edit aliases. A competing omnibox keyword can prevent TabFlow from receiving the command.

## Favicons show letter tiles

Letter tiles are the fallback when no usable icon loads. Saved HTTPS favicon URLs are tried first, then Chromium's local favicon endpoint, then Google's favicon service if allowed and no local endpoint is available.

**Remote favicon fallback** controls the Google service, not every remote image. A stored website icon can still request its own URL. Firewall, offline mode, a changed icon URL, or a cold browser cache can cause fallback tiles.

## Aurora is quieter than expected, or feels slow

Reduced motion, reduced transparency, increased contrast, constrained capability, and large workspaces can reduce enhancements automatically. Those fallbacks protect the usable workspace. Your theme and custom CSS also affect the result.

For additional tuning, lower Aurora's blur, disable drag physics or pointer sheen, turn off animated backgrounds, or select Normal. Avoid custom CSS that blurs or animates every card. Collapsing Collections or choosing Compact/List/Grid can make a large workspace easier to scan.

## Controls are missing or hard to read

Exit Zen mode with **Ctrl/⌘ + .** or Escape, and use panel controls to restore hidden navigation/live tabs. Links is hidden by default until enabled in Advanced settings.

If custom CSS or a custom theme is involved, clear CSS and select a built-in light/dark theme first. **Reset Settings** restores settings and toggles while keeping workspace contents and custom-theme definitions. It is different from **Clear All**.

## I deleted something, or imported the wrong backup

Saved-card and Collection deletion offers an Undo toast for a short time. Other destructive actions use their own confirmation/recovery behavior. Use a snapshot or exported JSON backup after Undo is no longer available.

Import replaces the current workspace; it is not a merge. A snapshot restores saved workspaces and Pages but keeps current settings, Links, and Tasks. Older collection-only snapshots leave Pages unchanged. Snapshot history itself is not included in JSON exports. See [backup scope](user-guide.md#backups-snapshots-and-moving-data).

## Import rejects a file

Use a JSON backup exported by TabFlow. Current envelopes identify `app: "tabflow"` and contain a document; recognized legacy formats are also supported. A renamed HTML file, browser bookmark export, or arbitrary JSON file is not a TabFlow backup.

Imported structures and navigation URLs are normalized. Imported HTML is isolated by the viewer rather than sanitized as ordinary text. If a valid file fails, keep the original file and report the error without posting private data publicly.

## Changes differ between windows or will not save

Cross-window updates use the browser profile's local storage events and merge independent edits where possible. They do not synchronize across profiles or browsers. Competing changes to the same field, deletion, or a whole-workspace replacement can still override another edit. Finish related edits in one window before changing the same items elsewhere.

A TabFlow page left open during extension reload may have an invalid extension context. Reopen it. If the console reports a quota, IndexedDB, or storage-access error, export what you can and preserve the original browser profile before attempting recovery. The main-document storage badge is an estimate and excludes IndexedDB bodies and other browser storage.

## Report a reproducible issue

Use the repository's [issue tracker](https://github.com/Playcape/tabflow-extension_edge/issues). Include:

- Browser and version, operating system, installation method, and TabFlow version.
- Design mode, theme, relevant accessibility preferences, and whether custom CSS is active.
- Exact steps, expected result, and actual result.
- Errors from the TabFlow page console and, for new-tab/shortcut issues, the extension background console.
- An anonymized example if a particular import or Page triggers the problem.

Do not post a full backup containing private URLs, tasks, aliases, or document content.
