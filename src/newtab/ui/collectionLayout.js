/* Pack differently sized Collections without shared row-height gaps.
 * DOM order stays the saved order; explicit grid cells form a masonry layout.
 * Heights remain natural, including collapsed Collections and drag previews. */
let area;
let observer;
let frame = 0;

export function scheduleCollectionLayout() {
  if (!frame) frame = requestAnimationFrame(() => {
    frame = 0;
    layoutCollections();
  });
}

export function layoutCollections() {
  if (!area || !area.clientWidth) return;
  const style = getComputedStyle(area);
  const columns = style.display === 'grid' ? style.gridTemplateColumns.split(' ').length : 1;
  const items = [...area.children];
  const packed = columns > 1;
  area.toggleAttribute('data-masonry', packed);
  for (const item of items) {
    item.style.removeProperty('grid-column');
    item.style.removeProperty('grid-row');
    // Notices and search summaries span the board, rather than taking a lane.
    if (packed && !item.classList.contains('collection')) item.style.gridColumn = '1 / -1';
  }
  if (!packed) return;

  const gap = parseFloat(style.getPropertyValue('--collection-gap')) || 18;
  // Read natural sizes in one pass before assigning grid cells.
  const sizes = items.map(item => item.offsetHeight); // Ignore temporary drop/hover transforms.
  const bottoms = Array(columns).fill(0);
  items.forEach((item, index) => {
    if (!sizes[index]) return; // The dragged source is temporarily out of flow.
    const full = !item.classList.contains('collection');
    const column = full ? 0 : bottoms.indexOf(Math.min(...bottoms));
    const top = full ? Math.max(...bottoms) : bottoms[column];
    const span = Math.ceil(sizes[index] + gap);
    item.style.gridColumn = full ? '1 / -1' : String(column + 1);
    item.style.gridRow = `${top + 1} / span ${span}`;
    if (full) bottoms.fill(top + span);
    else bottoms[column] = top + span;
  });
}

export function observeCollectionLayout(element) {
  area = element;
  if (!observer) {
    observer = new ResizeObserver(scheduleCollectionLayout);
    window.addEventListener('resize', scheduleCollectionLayout, { passive: true });
  }
  observer.disconnect();
  observer.observe(area);
  for (const item of area.children) observer.observe(item);
  layoutCollections();
}
