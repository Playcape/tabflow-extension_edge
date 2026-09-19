/* Three-way merge for independent edits from different browser windows.
   Identified arrays merge by id; local edits win only on the same field.
   Deletions stay deleted, and remote additions keep their order. */
const copy = (value) => value === undefined ? undefined : structuredClone(value);
const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const identified = (items) => Array.isArray(items) && items.every((item) => object(item) && typeof item.id === 'string');

export function mergeDocuments(base, local, remote) {
  if (equal(local, base)) return copy(remote);
  if (equal(remote, base) || equal(local, remote)) return copy(local);
  if (identified(base) && identified(local) && identified(remote)) {
    const originals = new Map(base.map((item) => [item.id, item]));
    const ours = new Map(local.map((item) => [item.id, item]));
    const theirs = new Map(remote.map((item) => [item.id, item]));
    const localOrderChanged = !equal(local.map((item) => item.id), base.map((item) => item.id));
    const ordered = localOrderChanged ? [...local, ...remote] : [...remote, ...local];
    const result = [];
    const seen = new Set();
    for (const item of ordered) {
      const id = item.id;
      if (seen.has(id)) continue;
      seen.add(id);
      if (originals.has(id) && (!ours.has(id) || !theirs.has(id))) continue;
      const merged = mergeDocuments(originals.get(id), ours.get(id), theirs.get(id));
      if (merged !== undefined) result.push(merged);
    }
    return result;
  }
  if (object(base) && object(local) && object(remote)) {
    const result = {};
    for (const key of new Set([...Object.keys(base), ...Object.keys(local), ...Object.keys(remote)])) {
      const value = mergeDocuments(base[key], local[key], remote[key]);
      if (value !== undefined) result[key] = value;
    }
    return result;
  }
  return copy(local);
}
