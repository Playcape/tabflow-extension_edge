/* Live-scene weather sends a city search and rounded coordinates to
 * Open-Meteo. Firefox asks for the optional `locationInfo` data-collection
 * permission first; it is kept outside workspace settings so an imported
 * backup cannot grant it. Other browsers rely on the in-app opt-in alone. */
import { ext, IS_FIREFOX } from './ext.js';

const permission = { data_collection: ['locationInfo'] };
let allowed = !IS_FIREFOX;
let supported = !IS_FIREFOX;
let revision = 0;

export function locationAllowed() { return allowed; }

export async function initLocationConsent(onChange = () => {}) {
  if (!IS_FIREFOX) return;
  const changed = (value) => { revision++; allowed = value; onChange(); };
  ext.permissions?.onAdded?.addListener((event) => {
    if (event.data_collection?.includes('locationInfo')) changed(true);
  });
  ext.permissions?.onRemoved?.addListener((event) => {
    if (event.data_collection?.includes('locationInfo')) changed(false);
  });
  const initialRevision = revision;
  try {
    const permissions = await ext.permissions.getAll();
    supported = Array.isArray(permissions.data_collection);
    if (revision === initialRevision) allowed = permissions.data_collection?.includes('locationInfo') ?? false;
  } catch {
    supported = false;
    allowed = false;
  }
}

// Called directly by a user gesture; do not await anything before request().
export async function requestLocationConsent() {
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

export async function removeLocationConsent() {
  if (!IS_FIREFOX) return;
  revision++;
  allowed = false;
  if (supported) await ext.permissions.remove(permission);
}
