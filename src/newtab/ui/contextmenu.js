/* ================================================================
   TabFlow — context menu
   Menu content is rebuilt per invocation from an items array, so
   feature code declares menus instead of toggling hidden buttons
   (the v1 approach that let the sort menu clobber the shared menu).

   Item shapes:
     { label, icon?, danger?, active?, onClick }
     { swatches: [{color|'', hex, title}], onPick(colorKey) }
     { separator: true }
   ================================================================ */

import { q, h } from '../../common/util.js';
import { icon } from '../../common/icons.js';

let menuEl = null;
let returnFocus = null;

function menuItems() {
  return [...menuEl.querySelectorAll('button:not(:disabled)')];
}

function onMenuKeydown(event) {
  const items = menuItems();
  const index = items.indexOf(document.activeElement);
  let next = null;
  switch (event.key) {
    case 'ArrowDown': next = (index + 1) % items.length; break;
    case 'ArrowUp': next = (index - 1 + items.length) % items.length; break;
    case 'Home': next = 0; break;
    case 'End': next = items.length - 1; break;
    case 'Escape':
      event.preventDefault();
      event.stopPropagation();
      hideMenu();
      return;
    case 'Tab':
      // Return to the invoker, then let the browser continue normal tab order.
      hideMenu();
      return;
    default: return;
  }
  event.preventDefault();
  event.stopPropagation();
  if (items.length) items[next]?.focus();
}

function ensureMenu() {
  if (!menuEl) {
    menuEl = q('#context-menu');
    menuEl.setAttribute('aria-label', 'Actions');
    menuEl.addEventListener('keydown', onMenuKeydown);
    document.addEventListener('mousedown', (event) => {
      if (!menuEl.contains(event.target)) hideMenu({ restoreFocus: false });
    });
    window.addEventListener('blur', () => hideMenu({ restoreFocus: false }));
  }
  return menuEl;
}

export function showMenu(x, y, items) {
  const menu = ensureMenu();
  if (!menu.contains(document.activeElement)) returnFocus = document.activeElement;
  menu.replaceChildren(
    ...items
      .filter(Boolean)
      .map((item) => {
        if (item.separator) return h('div', { class: 'context-separator', role: 'separator' });
        if (item.swatches) {
          return h('div', { class: 'ctx-color-picker', style: 'display:flex', role: 'group', 'aria-label': 'Colors' },
            item.swatches.map((swatch) =>
              h('button', {
                class: 'ctx-cp-swatch' + (swatch.color ? '' : ' ctx-cp-none'),
                style: swatch.hex ? `background:${swatch.hex}` : '',
                title: swatch.title,
                role: 'menuitem',
                tabindex: '-1',
                'aria-label': swatch.title || swatch.color || 'No color',
                text: swatch.hex ? '' : '✕',
                onclick: () => {
                  hideMenu();
                  item.onPick(swatch.color || undefined);
                },
              })
            )
          );
        }
        return h('button', {
          role: 'menuitem',
          tabindex: '-1',
          class:
            'context-item' + (item.danger ? ' danger' : '') + (item.active ? ' active' : ''),
          html: (item.icon ? icon(item.icon, 12) + ' ' : '') ,
          onclick: () => {
            hideMenu();
            item.onClick?.();
          },
        }, h('span', { text: item.label }));
      })
  );

  menu.style.display = 'block';
  menu.style.maxHeight = 'calc(100vh - 16px)';
  menu.style.maxWidth = 'calc(100vw - 16px)';
  menu.style.overflowY = 'auto';
  // Clamp inside the viewport once we know the rendered size.
  const rect = menu.getBoundingClientRect();
  menu.style.left = Math.max(8, Math.min(x, innerWidth - rect.width - 8)) + 'px';
  menu.style.top = Math.max(8, Math.min(y, innerHeight - rect.height - 8)) + 'px';
  menuItems()[0]?.focus({ preventScroll: true });
}

export function hideMenu({ restoreFocus = true } = {}) {
  const wasVisible = menuVisible();
  if (menuEl) menuEl.style.display = 'none';
  if (wasVisible && restoreFocus && returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  if (wasVisible) returnFocus = null;
}

export function menuVisible() {
  return menuEl && menuEl.style.display === 'block';
}
