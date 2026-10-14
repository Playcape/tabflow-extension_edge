# Product audit and design decisions

This record captures the source review behind the product redesign. It distinguishes the baseline findings from the intended product contract; verification results should be recorded separately when tests are run.

## Baseline audit

The review covered the five existing documentation files, manifest, background, browser adapter, theme data, boot/store/migrations, Page storage/viewer, shell markup, the complete stylesheet, and every feature module under `src/newtab/ui/`.

| Area | Finding before the redesign | Required correction |
| --- | --- | --- |
| New-tab documentation | README claimed one identical manifest and declarative takeover everywhere, while architecture described Chromium redirect behavior. `src/manifest.json` had only a service worker; packaging added Firefox's override. | Document two generated targets and separate their takeover behavior. |
| Pages | Pages, Page Spaces, the iframe viewer, and IndexedDB were missing from the documentation and module map. | Treat Pages as a first-class product view and describe their independent hierarchy and storage boundary. |
| Page content | HTML was copied into both JSON and IndexedDB; reads preferred an old IDB copy over imported inline content. The “quota fallback” comment did not describe the code. | Use explicit payload references, preserve old formats, and make backups self-contained. |
| Reset and recovery | The main clear action did not remove legacy records or Page payloads. Snapshots excluded Pages. | Define reset/snapshot scope, clean the stores intentionally, and preserve old snapshot compatibility. |
| Concurrent windows | Whole-document storage events were described as preventing clobbering, despite ignoring external changes while dirty. | Merge independent edits and document remaining same-field/race limits honestly. |
| Privacy | Documentation said the favicon fallback was the only network request. Stored icon URLs, embed Pages, HTML resources, and custom CSS could also load remote resources. | State the actual network boundaries and distinguish sandboxing from sanitization. |
| New-tab matching | Workspace recognition used the whole extension origin and overlapping async handlers. Other extension pages could be mistaken for duplicate workspaces. | Match the workspace page precisely, revalidate tab state, and serialize per-window decisions. |
| Visual systems | Aurora and Tonal were mostly additions to the same three-pane layout; mode and accessibility rules accumulated in one long stylesheet. | Give each mode its own composition and ownership while preserving shared feature code. |
| Accessibility | Multiple clickable rows/cards were not keyboard-operable; modal/palette focus behavior and motion policy were incomplete. | Make primary actions reachable, preserve visible focus, and apply accessibility preferences in both CSS and JavaScript. |
| Navigation | Collection controls remained visible in unrelated views; Page Space changes and palette results could leave the wrong content visible. | Make actions contextual and ensure navigation targets open the requested item/view. |
| Identity | The sidebar's generic symbol did not form a coherent identity with extension assets. | Use a canonical original mark, generated icon sizes, and shared UI references. |

## Visual direction

**Normal: editorial workbench.** Keep the chrome quiet. Put a Collection's identity and secondary actions beside its content, use readable horizontal bands, and make the active project's hierarchy obvious.

**Tonal: tactile board.** Move primary view navigation above the canvas, leave Spaces as an index, and tile Collections into generous rounded containers. Use an accent-derived tonal scale, pill controls, and more expressive headings to establish a different rhythm.

**Aurora: spatial workspace.** Detach the shell from an atmospheric background, keep workspace statistics in a compact toolbar line, and give Collections and cards their own optical layers. Light, edges, pointer response, and drag feedback provide depth without applying blur to every saved card.

These modes share saved data, actions, and browser capabilities. They do not require separate document schemas or forked feature implementations. Theme colors and card-view choices remain independent of the design mode.

## Engineering boundaries

- Preserve `tabflow_v3`, existing design settings, legacy imports, and stable feature hooks.
- Separate CSS by shared component responsibility and by mode; put responsive and accessibility adjustments last.
- Treat expensive effects as enhancements. Reduce them for user preferences, hidden pages, large workspaces, and limited capability.
- Keep Page documents isolated from extension privilege, including when opened in another tab.
- Await payload and metadata persistence where an operation reports success; never replace data with defaults after a transient read error.
- Verify browser behavior in a real extension context. A plain HTTP preview only exercises the development shim.

See [architecture](architecture.md) for the resulting module contracts, [the identity guide](brand.md) for the Flowfold concept, and [the user guide](user-guide.md) for the supported product behavior.
