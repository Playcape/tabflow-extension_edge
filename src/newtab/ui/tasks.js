/* ================================================================
   TabFlow — tasks (lightweight to-do list, optionally linked to URLs;
   was called "Next" in v1)
   ================================================================ */

import { q, h, uid, normalizeUrl } from '../../common/util.js';
import { icon } from '../../common/icons.js';
import { ext } from '../../common/ext.js';
import { getDoc, update } from '../store.js';
import { registerRenderer, render } from './bus.js';
import { toast } from './toast.js';

function renderTasks() {
  const list = q('#tasks-list');
  const tasks = getDoc().tasks;
  if (!tasks.length) {
    list.replaceChildren(
      h('div', { class: 'empty-state slim' },
        h('div', { class: 'empty-state-icon', html: icon('check-square', 32) }),
        h('div', { class: 'empty-state-title', text: 'Nothing queued' }),
        h('div', { class: 'empty-state-desc', text: 'Capture things to read or do next — optionally with a link.' })
      )
    );
    return;
  }
  list.replaceChildren(...tasks.map((task, index) => buildTaskRow(task, index)));
}

function buildTaskRow(task, index) {
  const checkbox = h('input', {
    type: 'checkbox',
    checked: task.done,
    'aria-label': `Mark “${task.title}” ${task.done ? 'not done' : 'done'}`,
  });
  checkbox.addEventListener('change', () => {
    update(() => (task.done = checkbox.checked));
    render('tasks');
  });

  const title = h('span', { class: 'next-title', text: task.title, title: task.url ?? '' });
  if (task.url) {
    title.classList.add('has-url');
    title.addEventListener('click', () => ext.tabs.create({ url: task.url }).catch(() => {}));
  }

  const handle = h('span', { class: 'next-drag-handle', html: icon('grip-vertical', 11) });
  const row = h('div', { class: 'next-item' + (task.done ? ' done' : ''), dataset: { idx: String(index) } },
    handle,
    checkbox,
    title,
    h('button', {
      class: 'next-del',
      html: icon('x', 11),
      title: 'Delete',
      'aria-label': `Delete ${task.title}`,
      onclick: () => {
        update((doc) => (doc.tasks = doc.tasks.filter((t) => t.id !== task.id)));
        render('tasks');
      },
    })
  );

  /* handle-gated reorder */
  let armed = false;
  handle.addEventListener('mousedown', () => {
    armed = true;
    document.addEventListener('mouseup', () => (armed = false), { once: true });
  });
  row.draggable = true;
  row.addEventListener('dragstart', (event) => {
    if (!armed) {
      event.preventDefault();
      return;
    }
    armed = false;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/x-tabflow-task', String(index));
    row.classList.add('dragging-src');
  });
  row.addEventListener('dragend', () => {
    row.classList.remove('dragging-src');
    q('#tasks-list').querySelectorAll('.next-item').forEach((el) => el.classList.remove('drop-above'));
  });
  row.addEventListener('dragover', (event) => {
    if (!event.dataTransfer.types.includes('application/x-tabflow-task')) return;
    event.preventDefault();
    q('#tasks-list').querySelectorAll('.next-item').forEach((el) => el.classList.remove('drop-above'));
    row.classList.add('drop-above');
  });
  row.addEventListener('drop', (event) => {
    const fromIdx = Number(event.dataTransfer.getData('application/x-tabflow-task'));
    if (!Number.isInteger(fromIdx) || fromIdx === index) return;
    event.preventDefault();
    update((doc) => {
      const [moved] = doc.tasks.splice(fromIdx, 1);
      doc.tasks.splice(fromIdx < index ? index - 1 : index, 0, moved);
    });
    render('tasks');
  });

  return row;
}

function addTask() {
  const titleInput = q('#task-title-input');
  const urlInput = q('#task-url-input');
  const title = titleInput.value.trim();
  if (!title) {
    toast('Enter a title.');
    return;
  }
  const url = urlInput.value.trim() ? normalizeUrl(urlInput.value) : '';
  update((doc) => doc.tasks.push({ id: uid(), title, url, done: false }));
  titleInput.value = '';
  urlInput.value = '';
  titleInput.focus();
  render('tasks');
}

export function initTasks() {
  registerRenderer('tasks', renderTasks);
  q('#btn-add-task').addEventListener('click', addTask);
  q('#task-url-input').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') addTask();
  });
  q('#task-title-input').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') addTask();
  });
}
