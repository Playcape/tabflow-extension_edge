/* ================================================================
   TabFlow — overlay/modal framework + confirm & prompt dialogs

   Replaces native confirm()/prompt() with themed, keyboard-friendly
   dialogs. Overlays are stacked; Escape closes the topmost one and
   clicking the dimmed backdrop dismisses.
   ================================================================ */

import { q, h } from '../../common/util.js';

const openStack = []; // [{ el, onClose }]

export function openOverlay(id, { onClose } = {}) {
  const el = typeof id === 'string' ? q(id) : id;
  el.style.display = 'flex';
  openStack.push({ el, onClose });

  const focusable = el.querySelector(
    'input:not([type=hidden]), textarea, select, button.accent-save, button'
  );
  if (focusable) setTimeout(() => focusable.focus(), 30);
  return el;
}

export function closeOverlay(id) {
  const el = typeof id === 'string' ? q(id) : id;
  const idx = openStack.findIndex((entry) => entry.el === el);
  if (idx !== -1) {
    const [entry] = openStack.splice(idx, 1);
    entry.onClose?.();
  }
  el.style.display = 'none';
}

export function closeTopOverlay() {
  const top = openStack[openStack.length - 1];
  if (!top) return false;
  closeOverlay(top.el);
  return true;
}

export function anyOverlayOpen() {
  return openStack.length > 0;
}

/** Dismiss when the backdrop (not the modal box) is clicked. */
export function bindBackdropClose(overlayEl) {
  overlayEl.addEventListener('mousedown', (event) => {
    if (event.target === overlayEl) closeOverlay(overlayEl);
  });
}

/* ---------- one-off dialogs (built on demand, removed after) ---------- */

function buildDialog({ title, body, actions }) {
  const modal = h('div', { class: 'hotkey-modal', role: 'dialog', 'aria-modal': 'true' },
    h('div', { class: 'hotkey-modal-title', text: title }),
    body,
    h('div', { class: 'hotkey-actions' }, actions)
  );
  const overlay = h('div', { class: 'hotkey-overlay', style: 'display:none' }, modal);
  document.body.append(overlay);
  return overlay;
}

/**
 * Themed confirm dialog.
 * @returns {Promise<boolean>}
 */
export function confirmDialog({
  title = 'Are you sure?',
  message = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
} = {}) {
  return new Promise((resolve) => {
    let overlay;
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      closeOverlay(overlay);
      overlay.remove();
      resolve(result);
    };
    const confirmBtn = h('button', {
      class: 'settings-btn ' + (danger ? 'danger-solid' : 'accent-save'),
      text: confirmLabel,
      onclick: () => finish(true),
    });
    overlay = buildDialog({
      title,
      body: h('div', { class: 'dialog-message', text: message }),
      actions: [
        h('button', { class: 'settings-btn', text: cancelLabel, onclick: () => finish(false) }),
        confirmBtn,
      ],
    });
    bindBackdropClose(overlay);
    // onClose covers Escape / backdrop dismissal.
    openOverlay(overlay, {
      onClose: () => {
        if (!settled) {
          settled = true;
          overlay.remove();
          resolve(false);
        }
      },
    });
    confirmBtn.focus();
  });
}

/**
 * Themed prompt dialog for a single text value.
 * @returns {Promise<string|null>} trimmed value, or null when cancelled
 */
export function promptDialog({
  title = 'Enter a value',
  label = '',
  value = '',
  placeholder = '',
  confirmLabel = 'Save',
} = {}) {
  return new Promise((resolve) => {
    let overlay;
    let settled = false;
    const input = h('input', { type: 'text', value, placeholder, 'aria-label': label || title });
    const finish = (result) => {
      if (settled) return;
      settled = true;
      closeOverlay(overlay);
      overlay.remove();
      resolve(result);
    };
    const submit = () => {
      const text = input.value.trim();
      if (text) finish(text);
    };
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') submit();
    });
    overlay = buildDialog({
      title,
      body: h('div', { class: 'card-edit-fields' },
        label ? h('label', { class: 'card-edit-label', text: label }) : null,
        input
      ),
      actions: [
        h('button', { class: 'settings-btn', text: 'Cancel', onclick: () => finish(null) }),
        h('button', { class: 'settings-btn accent-save', text: confirmLabel, onclick: submit }),
      ],
    });
    bindBackdropClose(overlay);
    openOverlay(overlay, {
      onClose: () => {
        if (!settled) {
          settled = true;
          overlay.remove();
          resolve(null);
        }
      },
    });
    input.focus();
    input.select();
  });
}
