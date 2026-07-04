/* ================================================================
   TabFlow — inline rename helper (contenteditable with commit/cancel)
   Enter commits, Escape cancels, blur commits.
   ================================================================ */

export function editInline(el, currentValue, onCommit) {
  el.contentEditable = 'true';
  el.classList.add('editing');
  el.focus();

  const range = document.createRange();
  range.selectNodeContents(el);
  const selection = getSelection();
  selection.removeAllRanges();
  selection.addRange(range);

  let finished = false;
  const finish = (commit) => {
    if (finished) return;
    finished = true;
    el.contentEditable = 'false';
    el.classList.remove('editing');
    const value = el.textContent.trim();
    if (commit && value && value !== currentValue) {
      onCommit(value);
    } else {
      el.textContent = currentValue;
    }
  };

  el.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      finish(true);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      finish(false);
    }
  });
  el.addEventListener('blur', () => finish(true), { once: true });
}
