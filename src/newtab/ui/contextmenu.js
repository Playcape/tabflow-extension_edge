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

function ensureMenu() {
  if (!menuEl) {
    menuEl = q('#context-menu');
    document.addEventListener('mousedown', (event) => {
      if (!menuEl.contains(event.target)) hideMenu();
    });
    window.addEventListener('blur', hideMenu);
  }
  return menuEl;
}

export function showMenu(x, y, items) {
  const menu = ensureMenu();
  menu.replaceChildren(
    ...items
      .filter(Boolean)
      .map((item) => {
        if (item.separator) return h('div', { class: 'context-separator' });
        if (item.swatches) {
          return h('div', { class: 'ctx-color-picker', style: 'display:flex' },
            item.swatches.map((swatch) =>
              h('button', {
                class: 'ctx-cp-swatch' + (swatch.color ? '' : ' ctx-cp-none'),
                style: swatch.hex ? `background:${swatch.hex}` : '',
                title: swatch.title,
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
  // Clamp inside the viewport once we know the rendered size.
  const rect = menu.getBoundingClientRect();
  menu.style.left = Math.min(x, innerWidth - rect.width - 8) + 'px';
  menu.style.top = Math.min(y, innerHeight - rect.height - 8) + 'px';
}

export function hideMenu() {
  if (menuEl) menuEl.style.display = 'none';
}

export function menuVisible() {
  return menuEl && menuEl.style.display === 'block';
}
