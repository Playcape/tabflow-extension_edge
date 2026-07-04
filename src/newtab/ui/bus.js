/* ================================================================
   TabFlow — render bus
   Feature modules register named render functions at init; anyone can
   request re-renders by name without importing the module (avoids
   circular imports between views).
   ================================================================ */

const renderers = new Map();

export function registerRenderer(name, fn) {
  renderers.set(name, fn);
}

export function render(...names) {
  for (const name of names) {
    const fn = renderers.get(name);
    if (fn) fn();
    else console.warn(`TabFlow: no renderer named "${name}"`);
  }
}

export function renderAll() {
  for (const fn of renderers.values()) fn();
}
