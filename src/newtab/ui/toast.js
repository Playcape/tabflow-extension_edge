/* ================================================================
   TabFlow — toast / snackbar with optional undo action
   ================================================================ */

import { q, h } from '../../common/util.js';
import { takeUndo } from '../store.js';

let hideTimer = null;

export function toast(message, { undo = false, duration = 4000 } = {}) {
  const bar = q('#snackbar');
  clearTimeout(hideTimer);
  bar.replaceChildren(h('span', { text: message }));

  if (undo) {
    const entry = takeUndo();
    if (entry) {
      bar.append(
        h('button', {
          class: 'snack-undo',
          text: 'Undo',
          onclick: () => {
            entry.apply();
            hideToast();
          },
        })
      );
    }
  }

  bar.style.display = 'flex';
  hideTimer = setTimeout(hideToast, duration);
}

export function hideToast() {
  q('#snackbar').style.display = 'none';
}
