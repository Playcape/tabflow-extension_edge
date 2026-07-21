# TabFlow User Guide

TabFlow replaces your browser's new tab page with a workspace for organizing
tabs. This guide covers every feature. For setup, see
[installation.md](installation.md); if something misbehaves, see
[troubleshooting.md](troubleshooting.md).

## The big picture

TabFlow organizes saved tabs in three levels:

```
Space  ("Work", "Private", "Research", …)
 └─ Collection  ("Project X", "Reading list", "Session – Jul 6", …)
     └─ Saved tab  (title + URL + optional note, tags, pin, hotkey)
```

The page has three panes:

- **Left sidebar** — search, the main views (Collections / Links / Tasks),
  your Spaces, and Settings.
- **Center** — the collections of the active space (or Links / Tasks / Settings).
- **Right panel** — your *live* open tabs, grouped by window, plus recently
  closed tabs.

Both side panes can be hidden with the toggle buttons in their headers; small
tabs on the screen edges bring them back.

---

## Spaces

Spaces are separate workspaces, listed in the sidebar. Each space has its own
collections and its own view mode.

| Action | How |
| --- | --- |
| Switch space | Click it |
| Create | **+** next to the SPACES label (name is immediately editable) |
| Rename | Double-click the name, or right-click → Rename |
| Color / emoji icon | Right-click → Customize… |
| Reorder | Drag by the grip handle (appears on hover) |
| Delete | Hover → ✕, or right-click → Delete — a confirmation shows how many collections and tabs would be removed |

The last remaining space cannot be deleted.

## Collections

A collection is a named group of saved tabs inside a space.

| Action | How |
| --- | --- |
| Create | **+ Collection** in the toolbar, or the button in the empty state |
| Rename | Double-click the name |
| Collapse / expand | Chevron next to the name (toolbar has Expand all / Collapse all) |
| Reorder | Drag by the grip handle left of the chevron |
| Color tag | ⋯ menu → pick a swatch (colors the header edge) |
| Move to another space | ⋯ menu → *Move to space…* |
| Sort tabs | ↕ button → Title A→Z / Z→A / By domain / Manual (pinned tabs always sort first) |
| **Open all** | Opens every tab of the collection in the current window |
| **Window** | Opens them in a new window |
| **Open as tab group** | ⋯ menu, on browsers that support tab groups (Edge/Chrome) |
| Delete | ⋯ menu → Delete — an **Undo** toast appears for 4 seconds |

## Saved tabs (cards)

| Action | How |
| --- | --- |
| Open | Click the card — opens **in the current tab** (it's a start page). **Ctrl/Cmd-click or middle-click** opens a background tab; the ↗ action button opens a foreground tab |
| Add manually | Hover the collection → click the dashed **+** card |
| Edit title / URL / note / tags | ✎ action button (hover the card) |
| Copy URL | ⧉ action button |
| Pin to top | 📌 action button — pinned cards get an accent edge and always sort first |
| Assign a hotkey | ⌨ action button (see *Hotkeys* below) |
| Remove | ✕ in the corner — **Undo** toast appears |
| Keyboard | Cards are focusable with Tab; **Enter** opens, **Delete** removes |

Notes appear as a small document icon (hover to read); tags show as pills on
the card and are searchable.

### View modes

Each space remembers its own view, chosen from the **View** dropdown:

- **Card** — title, domain, favicon, actions (default)
- **Compact** — smaller cards, no URL line
- **List** — one row per tab
- **Grid** — dense favicon-first tiles

## Search

Press **/** (or click the search box) and type. Search covers **titles, URLs,
and tags across all spaces**, with matches highlighted. Results stay grouped
by space / collection, and all card actions keep working. **Esc** clears.

## The Open Tabs panel (right side)

Shows every tab currently open in the browser, grouped by window.

- **Click** a tab to jump to it.
- **Drag** a tab onto any collection to save it there.
- **⬇ on a window header** saves that whole window as a new collection.
- **⬇ in the panel header** ("Save session") saves *all* open tabs as a
  collection named `Session – <date> <time>`.
- **⊕ in the panel header** saves the current/most recent tab via a
  collection picker.
- **Recently Closed** lists the last 10 closed tabs — click to restore
  (with full history where the browser supports it).

## Hotkeys (jump to a site from anywhere)

TabFlow has 4 global hotkey slots, **Alt+1 – Alt+4** by default. Assign a
saved tab to a slot via the ⌨ button on its card. Pressing the key **in any
tab** focuses an existing tab of that site or opens it — e.g. Alt+1 = Gmail.

Remap the keys in your browser's extension-shortcut settings (the hotkey
dialog links there, or shows instructions on Firefox/Zen).

## Links (address-bar aliases)

The **Links** view manages shortcuts for the address bar: type
**`to` + space + alias name** and press Enter to jump to the saved URL —
e.g. `to mail` → your webmail. Partial names match; suggestions appear as
you type.

## Tasks

A lightweight queue of things to read or do. Each task has a title, an
optional URL (click the title to open it), a done-checkbox, drag-reordering,
and delete.

## Clock

An optional clock/date/greeting header above the collections —
Settings → Layout → Clock.

## The toolbar button

Clicking the TabFlow icon in the browser toolbar from **any** page jumps to
your open TabFlow tab (or opens one). Handy on Zen if you keep the URL-bar
new-tab popup enabled.

---

# Settings

## Appearance

- **Themes** — 18 built-in themes (Dark, Light, Dracula, Nord, Monokai,
  Solarized, Rosé Pine, Forest, Catppuccin ×2, Tokyo Night, One Dark,
  Gruvbox, Ayu Mirage, Material Ocean, Synthwave, Midnight, Paper).
- **Custom Themes** — build your own with the color editor (12 color slots,
  live preview, saved alongside the presets).
- **Accent Color** — 16 presets or any custom color; used for highlights,
  buttons, and selection.
- **Background** — solid, three gradient styles, or a custom color; plus an
  optional dot / grid / noise pattern.

## Typography

- **Font** — five *system font stacks* (System, Humanist, Geometric, Rounded,
  Monospace). Nothing is downloaded: fast, private, works offline.
- **Font size** — Small / Normal / Large.

## Layout

- **Corner radius** — 0–20 px.
- **Card density** — Comfortable / Cozy / Compact.
- **Default view** — sets the view mode of *all* spaces at once.
- **Sidebar width** — 160–320 px.
- **Clock** — on/off.

## Data

- **Storage** — shows where data lives (locally, in this browser profile)
  and its current size.
- **Snapshots** — save a named copy of all spaces/collections; restore or
  delete any time (up to 20 kept). Restoring replaces collections but keeps
  settings.
- **Import from Bookmarks** — import any bookmark folder as a new collection.
- **Homepage** — copy the TabFlow URL to use it as your browser homepage.
- **Export JSON** — downloads a complete backup: spaces, collections, tabs,
  links, tasks, and settings.
- **Import JSON** — restores a backup (asks for confirmation; v1 backups are
  converted automatically). This is also how you **move data between
  browsers** — export in one, import in the other.
- **Reset Settings** — appearance back to defaults; collections and custom
  themes are kept.
- **Clear All** — deletes everything, after a confirmation.

On Firefox/Zen an extra **Zen / Firefox Setup** section appears here.

## Advanced

- **Remote favicon fallback** — when a saved tab has no stored icon, TabFlow
  can fetch one from Google's favicon service (this sends the site's domain
  to Google). Turn it off to get neutral letter tiles instead. Edge/Chrome
  resolve icons locally and rarely need it.
- **Custom CSS** — inject your own CSS on top of everything; persisted.

---

# Keyboard reference

| Key | Where | Action |
| --- | --- | --- |
| `/` | anywhere on the page | Focus search |
| `Esc` | anywhere | Close menu/dialog, else clear search |
| `Enter` | focused card | Open tab |
| `Delete` | focused card | Remove tab (undo toast) |
| `Enter` | rename fields / dialogs | Commit |
| `Esc` | rename fields | Cancel |
| `Alt+1…4` | **anywhere in the browser** | Hotkey slots (remappable) |
| `Ctrl/Cmd-click` / middle-click | card | Open in background tab |

# Good to know

- Saving is automatic (about ⅓ s after a change) — there is no Save button.
- If TabFlow is open in several windows at once, changes made in one appear
  in the others automatically.
- Deleting a tab or collection always offers **Undo** in the toast.
- All data is local to the browser profile — export regularly if you care
  about it. See [Data & privacy in the README](../README.md#privacy).
