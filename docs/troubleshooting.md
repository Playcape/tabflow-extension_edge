# Troubleshooting & FAQ

## New tabs don't show TabFlow

**Zen Browser:** this is Zen's "URL bar replaces new tab" feature — it never
creates a new-tab page, so TabFlow can't appear. Open `about:config`, set
**`zen.urlbar.replace-newtab`** to **`false`**. (TabFlow also shows this hint
in-app on Firefox-based browsers, with a copy button.)

**Firefox:** the first new tab after installing shows a "Keep changes?" bar —
if you dismissed it with *Revert*, Firefox blocks the override. Reinstall the
add-on and accept the prompt, or check `about:addons` → TabFlow → Options
isn't disabled.

**Edge/Chrome:** check `edge://extensions` / `chrome://extensions` — TabFlow
must be enabled, and no *other* extension may also override the new tab page
(the most recently installed one wins).

## The extension disappeared after restarting Firefox/Zen

Temporary add-ons (loaded via `about:debugging`) unload on every restart —
that's a browser rule, not a bug. Your data survives; reload the add-on and
it's all there. For a permanent install, sign the package on
addons.mozilla.org — see [installation.md](installation.md#permanent-installs-on-firefoxzen).

## "Background script: Stopped" in about:debugging

Normal. TabFlow's background is an event page that sleeps until something
wakes it (a hotkey, an omnibox entry, the toolbar button). It is not an error.

## Yellow manifest warning about the "favicon" permission

Appears only when loading the raw `src/` folder in Firefox/Zen: `favicon` is
a Chromium-only permission and Firefox skips it with a warning. Harmless —
and the packaged `dist/zen` build removes it entirely.

## Hotkeys (Alt+1…4) don't work

- The keys may collide with a browser or OS shortcut (on some Linux setups
  Alt+numbers switches browser tabs). Remap them: Edge/Chrome →
  `chrome://extensions/shortcuts`; Firefox/Zen → `about:addons` → gear icon →
  *Manage Extension Shortcuts*.
- A slot only fires if a saved tab is assigned to it (⌨ button on a card).

## Omnibox "to" aliases don't trigger

Type **`to`**, then a **space**, then the alias name, in the address bar.
The alias must exist in the **Links** view. If another extension also claims
the `to` keyword, the browser picks one.

## Favicons are missing or show letter tiles

- Icons are stored when you save a tab from the Open Tabs panel; manually
  added tabs have none at first.
- On Edge/Chrome, icons resolve from the browser's local favicon cache.
- On Firefox/Zen, tabs without a stored icon use Google's favicon service —
  but only if **Settings → Advanced → Remote favicon fallback** is on.
  With it off you get letter tiles by design (privacy).

## I deleted something by accident

Every tab/collection deletion shows an **Undo** toast for 4 seconds. Beyond
that, restore from **Settings → Data → Snapshots** or an exported JSON backup.
Space deletion asks for confirmation up front and cannot be undone afterwards.

## Import says "Not a valid TabFlow backup file"

The file must be a TabFlow export (v1 or v2 format). If it was edited by
hand, make sure it is valid JSON and still has a `spaces` array (v1) or the
`app: "tabflow"` envelope (v2). Imports are sanitized: entries with unsafe
URLs (e.g. `javascript:`) come through with the URL removed.

## The new tab shows a blank / generic icon instead of the TabFlow logo

Shouldn't happen: TabFlow loads as an ordinary extension page (the background
redirects a new tab to TabFlow's own URL), and an ordinary page shows its
favicon. If the icon is missing, reload the extension so the new background
script takes effect. Note: the browser's *own* New Tab Page can never show a
custom favicon — that's why TabFlow redirects to a normal page instead of using
`chrome_url_overrides`.

## A second TabFlow tab keeps opening

It shouldn't anymore: TabFlow keeps a single tab per window. Opening another
new tab while one is already open sends you back to the existing tab and puts
the cursor in the search box, which also works as a launcher — type a URL or a
**Links** alias and press **Enter** to go straight there. Opening a new
*window* still gives that window its own TabFlow tab. (If duplicates were open
from before this update, close the extras once; new tabs won't pile up again.)

## Two TabFlow tabs show different content

They shouldn't — instances sync via storage events. If one was open during
an extension *reload*, it may be orphaned; close and reopen it.

## Where exactly is my data? Is anything sent anywhere?

Everything lives in `browser.storage.local` of the current browser profile —
nothing is synced or uploaded by TabFlow. There is no analytics and no remote
code. The single optional network call is the favicon fallback described
above. Export regularly if the data matters to you.

## Reporting a bug

Open the TabFlow tab, press **F12** → Console, reproduce the issue, and
include any red errors plus browser name/version in your report at
<https://github.com/Playcape/tabflow-extension_edge/issues>.
