# Using TabFlow

TabFlow keeps saved work and live browser activity together. For installation and browser-specific setup, start with the [installation guide](installation.md). For implementation details, see [architecture](architecture.md).

## Your workspace

There are two independent hierarchies:

```text
Space                         Page Space
└─ Collection                 └─ Page
   └─ Saved tab                  ├─ Uploaded HTML
      ├─ Note / tags / pin       ├─ Pasted HTML
      └─ Optional hotkey         └─ Embedded website URL
```

**Collections** is your saved browsing workspace. **Pages** holds documents. **Tasks** is a shared queue, and **Links** contains address-bar aliases. Links is hidden initially; enable **Settings → Advanced → Show Links in sidebar** to manage it.

The navigation area switches views and Spaces. The main area shows your current work, while **Open Tabs** shows the live browser. Hide or reopen side panels with their panel controls. Pages hides Open Tabs to give the document more room. Normal, Tonal, and Aurora arrange and style these tools differently without changing their contents.

## Spaces and Collections

Choose **+** beside **Spaces** to create a workspace. Double-click its name or use its context menu to rename it. **Customize** changes its color or emoji. Drag a Space by its grip to reorder it. Deleting a Space asks for confirmation and removes its Collections and saved tabs; the last Space cannot be deleted.

Inside a Space, choose **+ Collection** to create a group of saved tabs.

| Collection action | Control |
| --- | --- |
| Rename | Double-click the collection name |
| Collapse or expand | Chevron beside the name; the toolbar also has Expand all / Collapse all |
| Reorder | Drag the collection grip |
| Color | Collection menu → color swatch |
| Move to another Space | Collection menu → Move to space |
| Sort saved tabs | Sort menu → Title A–Z, Title Z–A, By domain, or Manual |
| Open every saved URL | Open all; Window opens them in a new browser window |
| Open as a browser tab group | Collection menu, where the browser APIs support grouping |
| Delete | Collection menu → Delete; use the Undo toast to restore it |

Pinned cards sort before unpinned cards. A collection is a saved set of links, not a live browser group: opening it does not establish two-way synchronization with browser tabs.

## Saved tabs

Use a collection's **+** card to add a tab manually, or drag a live tab into the collection. A saved tab has a title and URL, plus optional notes, tags, a pin, and a hotkey slot.

| Action | How |
| --- | --- |
| Open | Click the card or press Enter when it is focused; opens in the current TabFlow tab |
| Keep TabFlow open | Ctrl/Cmd-click or middle-click opens a background tab; the external-link action opens a foreground tab |
| Edit | Card edit action: title, URL, note, and comma-separated tags |
| Copy URL / pin / hotkey | Card actions or context menu |
| Remove | Remove action or Delete on a focused card; an Undo toast appears |
| Other opening options | Context menu: foreground tab, background tab, or window |

**Jump to an already-open tab**, in Advanced settings, changes normal saved-tab launching: if a matching page is already open, TabFlow focuses it and its window. Matching ignores a trailing slash and URL fragment; it keeps the query string. This option can also affect launches requested in a new tab.

### Views and drag-and-drop

Each Space remembers its own **View**:

- **Card:** title, domain, favicon, and secondary details.
- **Compact:** smaller cards with less metadata.
- **List:** a row per saved tab.
- **Grid:** dense favicon-first tiles.

Drag saved cards within or between Collections. Drop near the leading edge to insert before a card, near the trailing edge to insert after it, or in the middle to swap the two cards. In List view those regions run from top to bottom; in other views they run left to right. A placeholder marks insertion and an outline marks swapping. The collection drop area appends a card. Manual placement switches the destination to manual sorting where applicable.

Drag a live tab from Open Tabs into a Collection to save a copy; the live tab stays open. Clear saved-tab search before rearranging, because drag placement is disabled in filtered results. Aurora can add a floating drag ghost and drop animation; the data operation is the same in every design mode.

## Search and command palette

Press **/** outside a text field to reach saved-tab search. It matches titles, URLs, and tags across all collection Spaces; results remain grouped by Collection. Notes and Page bodies are not searched by this filter. Clear the field or press Escape while it is focused to return to the workspace.

Search also launches an exact Links alias or a recognizable HTTP(S) address when you press **Enter**. Plain words remain a local filter; this field does not send web-search queries to a search engine.

Open the **command palette** with **Ctrl/⌘ + K**. It searches saved tabs, Collections, Spaces, Pages, Page Spaces, Links, Tasks, and navigation actions. Use Up/Down to select, Enter to run, and Escape to dismiss. It works locally from workspace metadata, not full Page HTML or browser history. The palette can be disabled in Advanced settings.

## Open Tabs, sessions, and recently closed

The live panel groups browser tabs by window. Selecting a row focuses its tab and window. Window headings collapse their tab lists, and refresh controls reload the browser data.

- **Save window:** create a Collection from that window's HTTP(S) tabs in the active Space.
- **Save session:** create a Collection from HTTP(S) tabs across the browser's accessible windows.
- **Add current tab:** choose a Collection for the most recently used suitable tab in this window. The TabFlow page itself is excluded.
- **Recently Closed:** restore a recently closed tab through the browser's sessions API, with a URL-opening fallback where possible.

Saving a session does not close tabs and does not save browser history, form contents, pinned state, tab-group structure, or window placement. It stores links and their available titles/favicons. Browser-internal pages and TabFlow itself are excluded from session capture. Recently Closed shows individual tab entries from the browser's latest session results, so it may contain fewer than ten rows.

## Pages and Page Spaces

Choose **Pages** in navigation. The sidebar now shows **Page Spaces**, separate from collection Spaces. Create, rename, customize, and delete these independently; one Page Space must remain.

Choose **Add Page**, give it a title, select a method, and optionally add tags:

| Method | What is saved |
| --- | --- |
| **Upload HTML** | The text of an `.html`/`.htm` file, copied into local storage; it is not linked to the original file |
| **Embed URL** | An HTTP(S) address, loaded live when you open the Page; this is not an offline website capture |
| **Direct Code** | The HTML you paste, including its styles and any scripts the browser permits |

Open a Page card to read it inside TabFlow. The viewer has **Back to Pages**, **Edit Page**, and **Open in new browser tab** controls. The external viewer keeps uploaded/pasted content inside a sandboxed frame; an embedded URL opens the actual website when requested in a new tab.

Small document bodies are stored with workspace data. Larger bodies use IndexedDB in the same browser profile, with a reference in the workspace. JSON export resolves that reference so the document content is included in the file. Copying only the `tabflow_v3` storage entry is therefore not a complete Pages backup.

The viewer does not grant imported HTML access to TabFlow's parent document, saved data, or extension APIs. It allows sandboxed document behavior; that is different from sanitizing the HTML. Remote images, CSS, embeds, and other permitted resources can still contact their providers. Browser CSP can block scripts, and websites may reject embedding through their own framing policies. Use **Open in new browser tab** for an embed that refuses to load.

Relative resources beside an uploaded file are not uploaded with it. For portable Pages, use self-contained HTML or explicit resource URLs. Changes made inside a displayed form are not a guaranteed persistent document edit and are not part of backups; use **Edit Page** to change saved content.

Chrome/Edge use a separate sandbox renderer that permits inline document scripts. Firefox/Zen use a sandboxed inline document with their extension security policy, which may block those scripts. Static documents are the most portable format. TabFlow never gives a Page extension privileges to make a script work.

## Links, hotkeys, and Tasks

### Address-bar aliases

Enable Links in Advanced settings, then add a short name and URL. In the browser address bar, type **`to`**, a space, and the alias, for example `to mail`. Suggestions use name prefixes; submitting first checks for an exact alias and then a partial name. The matched URL replaces the current browser tab. You can also launch exact aliases from TabFlow's search field.

### Four browser shortcuts

Assign a saved tab using its hotkey action. TabFlow provides four slots with suggested shortcuts **Alt+1** through **Alt+4**. Slots work while browsing other tabs, subject to the browser's shortcut configuration and OS conflicts; they are not necessarily system-wide shortcuts outside the browser.

A hotkey prefers an already-open exact URL, then another page on the same site, otherwise it opens the saved URL. Site matching is intentionally broad and uses a lightweight domain approximation. Remap keys through the browser's extension-shortcut manager; the assignment dialog links to it or shows Firefox/Zen instructions.

### Tasks

Add a title and optional HTTP(S) URL. Check a task when done, open its linked title, reorder with its grip, or delete it. Tasks are shared across the workspace rather than scoped to a Space.

## Appearance and Settings

Settings applies changes immediately and saves automatically. Design, theme, and card view are separate choices: changing a design mode does not move your data or reset your chosen theme.

| Settings area | Options |
| --- | --- |
| **Appearance** | Normal / Aurora / Tonal; 20 built-in themes including Prism Dark and Prism Light; custom themes with live color preview; accent presets and custom accent; solid, gradient, or custom background; dots, grid, noise, or no pattern |
| **Aurora** | Surface opacity, blur, edge highlight, depth, unified glass treatment, drag physics, pointer sheen, ambient glow; appears when Aurora is selected |
| **Tonal** | Accent tint strength, corner roundness, expressive typography, and motion; appears when Tonal is selected |
| **Typography** | System, Humanist, Geometric, Rounded, or Monospace system-font stacks; Small, Normal, or Large text |
| **Layout** | Corner radius, Comfortable / Cozy / Compact density, sidebar width, clock visibility, and default saved-tab view |
| **Advanced** | Links visibility, palette, existing-tab focusing, Zen mode, optional frosted glass and animated background, Reduce motion, greeting name, 24-hour time, seconds, favicon fallback, and custom CSS |
| **Data** | Storage estimate, snapshots, bookmarks import, homepage URL, JSON export/import, reset settings, clear data; Firefox-based builds also show setup guidance |

**Default View applies to all existing collection Spaces**, as well as the default for newly created ones. The generic corner-radius preference can be superseded by the mode's own shape language, especially Tonal's roundness control.

The clock is optional. Enable it in Layout, then set its greeting and time format in Advanced. **Zen mode** hides the surrounding interface; use **Ctrl/⌘ + .**, Escape, or the exit control to return.

Aurora limits expensive rendering to selected surfaces and active interactions. Reduced-motion settings suppress movement; reduced-transparency and contrast preferences favor solid, readable surfaces. Those fallbacks may make a mode look quieter than its preview. Font availability depends on your operating system; TabFlow does not download the built-in font choices.

**Custom CSS** is appended to the app's styles and saved with settings. It can change every aspect of the interface, including hiding controls or reducing contrast. It can also request remote resources through CSS. Use **Clear** to remove it, or **Reset Settings** to return to the defaults while keeping custom theme definitions.

## Backups, snapshots, and moving data

TabFlow saves to this browser profile after a short debounce. Other open TabFlow pages receive storage changes, and independent edits are merged when possible. This is not conflict-free collaboration: competing edits to the same field, deletion, or whole-workspace replacement can still override work. Finish related edits in one window before changing the same items elsewhere.

| Tool | Includes / behavior |
| --- | --- |
| **Export JSON** | Collection Spaces, Collections, saved tabs and metadata, Page Spaces and resolved Page content, Links, Tasks, settings, custom themes, custom CSS, and panel preferences |
| **Import JSON** | Replaces the current workspace after confirmation; accepts current exports and recognized older TabFlow documents |
| **Snapshot** | A named local copy of collection Spaces and Page Spaces/content; keeps up to 20. Restore replaces those workspaces and preserves current settings, Links, and Tasks. Older collection-only snapshots leave current Pages intact |
| **Import from Bookmarks** | Copies the direct bookmarks from the selected folder into a Collection in the active Space; nested folders are listed separately |
| **Reset Settings** | Restores all settings defaults, including feature toggles and custom CSS; preserves workspace content and saved custom theme definitions |
| **Clear All** | Removes workspace data, Page storage, snapshots, and legacy records, then creates a fresh starter workspace after confirmation |

An export does **not** contain snapshot history, live browser tabs, browser shortcut remappings, or unsaved state inside a Page. The storage badge estimates the main JSON document rather than the entire browser's storage use, including IndexedDB.

To move browsers, export in the old browser and import that JSON file in the new one. This replaces the destination workspace; export the destination first if you want to keep it. Snapshot history remains local, so export the current workspace rather than relying on snapshots as a portable backup.

## Keyboard reference

| Key | Action |
| --- | --- |
| `Ctrl/⌘ + K` | Open or close the command palette |
| `Ctrl/⌘ + .` | Toggle Zen mode |
| `/` outside a text field | Focus saved-tab search |
| `Escape` | Dismiss the current menu/dialog/palette, exit Zen, or clear focused search |
| `Enter` on a saved card | Open the saved tab |
| `Delete` on a saved card | Remove it with an Undo toast |
| `Ctrl/Cmd-click` or middle-click | Open a saved card in a background tab |
| `Enter` / `Escape` while renaming | Commit / cancel the name |
| `Alt+1…4` in the browser | Assigned hotkey slots, unless remapped |

Tab and Shift+Tab navigate controls; focus outlines show where keyboard actions will apply. Browser shortcuts can differ by platform or collide with other extensions. See [troubleshooting](troubleshooting.md) for recovery, Pages limitations, and performance tuning.
