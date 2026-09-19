/* ================================================================
   TabFlow — overlay/modal framework + confirm & prompt dialogs

   Replaces native confirm()/prompt() with themed, keyboard-friendly
   dialogs. Overlays are stacked; Escape closes the topmost one and
   clicking the dimmed backdrop dismisses.
   ================================================================ */

import { q, h } from '../../common/util.js';

const openStack = []; // [{ el, onClose, returnFocus }]
const inertBeforeOpen = new Map();
const FOCUSABLE = 'a[href], button, input:not([type=hidden]), textarea, select, [tabindex]';
let focusGuardsInstalled = false;
let nextDialogId = 0;

function focusableWithin(el) {
  return [...el.querySelectorAll(FOCUSABLE)].filter((node) =>
    !node.disabled && node.tabIndex >= 0 && !node.closest('[inert]') &&
    node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden'
  );
}

function focusEntry(entry) {
  const targets = focusableWithin(entry.el);
  const target = targets.find((node) => node.matches('input, textarea, select')) ?? targets[0];
  if (target) target.focus({ preventScroll: true });
  else {
    const dialog = entry.el.querySelector('[role="dialog"]') ?? entry.el;
    dialog.tabIndex = -1;
    dialog.focus({ preventScroll: true });
  }
}

/** Only the top overlay is interactive. Preserve pre-existing inert attributes. */
function syncInertBackground() {
  for (const [el, inert] of inertBeforeOpen) el.inert = inert;
  inertBeforeOpen.clear();
  const top = openStack.at(-1);
  if (!top) return;
  // Walking ancestors also supports overlays embedded inside a component.
  for (let active = top.el; active && active !== document.body; active = active.parentElement) {
    for (const sibling of active.parentElement?.children ?? []) {
      if (sibling === active || sibling.matches('script, style, link')) continue;
      if (!inertBeforeOpen.has(sibling)) inertBeforeOpen.set(sibling, sibling.inert);
      sibling.inert = true;
    }
  }
}

function installFocusGuards() {
  if (focusGuardsInstalled) return;
  focusGuardsInstalled = true;
  document.addEventListener('keydown', (event) => {
    const top = openStack.at(-1);
    if (!top || event.key !== 'Tab') return;
    const targets = focusableWithin(top.el);
    const first = targets[0];
    const last = targets.at(-1);
    const active = document.activeElement;
    if (!targets.length) {
      event.preventDefault();
      focusEntry(top);
    } else if (!top.el.contains(active) || (event.shiftKey ? active === first : active === last)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus({ preventScroll: true });
    }
  }, true);
  document.addEventListener('focusin', (event) => {
    const top = openStack.at(-1);
    if (top && !top.el.contains(event.target)) focusEntry(top);
  });
}

export function openOverlay(id, { onClose } = {}) {
  const el = typeof id === 'string' ? q(id) : id;
  if (!el) return null;
  const existing = openStack.find((entry) => entry.el === el);
  if (existing) {
    if (existing === openStack.at(-1)) focusEntry(existing);
    return el;
  }
  installFocusGuards();
  const entry = { el, onClose, returnFocus: document.activeElement };
  el.style.display = 'flex';
  openStack.push(entry);
  syncInertBackground();
  focusEntry(entry);
  return el;
}

export function closeOverlay(id) {
  const el = typeof id === 'string' ? q(id) : id;
  if (!el) return;
  const idx = openStack.findIndex((entry) => entry.el === el);
  const wasTop = idx === openStack.length - 1;
  el.style.display = 'none';
  if (idx !== -1) {
    const [entry] = openStack.splice(idx, 1);
    syncInertBackground();
    entry.onClose?.();
    if (wasTop) {
      const top = openStack.at(-1);
      const opener = entry.returnFocus;
      if (opener?.isConnected && (!top || top.el.contains(opener))) {
        opener.focus({ preventScroll: true });
      } else if (top) focusEntry(top);
    }
  }
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
  const titleId = `dialog-title-${++nextDialogId}`;
  const modal = h('div', { class: 'hotkey-modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId },
    h('div', { class: 'hotkey-modal-title', id: titleId, text: title }),
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
