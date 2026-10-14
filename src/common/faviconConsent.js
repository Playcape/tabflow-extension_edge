/* Firefox remote icons can disclose browsing domains. Permission is kept
 * separately from workspace settings so an imported backup cannot grant it. */
import { ext, IS_FIREFOX } from './ext.js';

const permission = { data_collection: ['browsingActivity'] };
let allowed = !IS_FIREFOX;
let supported = !IS_FIREFOX;
let revision = 0;

export function remoteIconsAllowed() { return allowed; }

export async function initFaviconConsent(onChange = () => {}) {
  if (!IS_FIREFOX) return;
  const changed = (value) => {
    revision++;
    allowed = value;
    onChange();
  };
  ext.permissions?.onAdded?.addListener((event) => {
    if (event.data_collection?.includes('browsingActivity')) changed(true);
  });
  ext.permissions?.onRemoved?.addListener((event) => {
    if (event.data_collection?.includes('browsingActivity')) changed(false);
  });
  const initialRevision = revision;
  try {
    const permissions = await ext.permissions.getAll();
    supported = Array.isArray(permissions.data_collection);
    if (revision === initialRevision) {
      allowed = permissions.data_collection?.includes('browsingActivity') ?? false;
    }
  } catch {
    // Older Firefox versions and unavailable APIs keep remote icons disabled.
    supported = false;
    allowed = false;
  }
}

// Called directly by a user gesture; do not await anything before request().
export async function requestFaviconConsent() {
  if (!IS_FIREFOX) return true;
  if (!supported) return false;
  const initialRevision = revision;
  try {
    const granted = await ext.permissions.request(permission);
    if (revision === initialRevision) allowed = granted;
  } catch {
    allowed = false;
  }
  return allowed;
}

export async function removeFaviconConsent() {
  if (!IS_FIREFOX) return;
  revision++;
  allowed = false;
  if (supported) await ext.permissions.remove(permission);
}
