/* ================================================================
   TabFlow — links (omnibox aliases: type "to <name>" in the URL bar)
   ================================================================ */

import { q, h, uid, normalizeUrl } from '../../common/util.js';
import { icon } from '../../common/icons.js';
import { ext } from '../../common/ext.js';
import { getDoc, update } from '../store.js';
import { registerRenderer, render } from './bus.js';
import { toast } from './toast.js';

function renderLinks() {
  const list = q('#links-list');
  const links = getDoc().links;
  if (!links.length) {
    list.replaceChildren(
      h('div', { class: 'empty-state slim' },
        h('div', { class: 'empty-state-icon', html: icon('link', 32) }),
        h('div', { class: 'empty-state-title', text: 'No aliases yet' }),
        h('div', {
          class: 'empty-state-desc',
          text: 'Add a name + URL, then type “to <name>” in the address bar to jump there.',
        })
      )
    );
    return;
  }
  list.replaceChildren(...links.map(buildLinkRow));
}

function buildLinkRow(link) {
  const row = h('div', { class: 'link-item' },
    h('button', {
      class: 'link-name',
      text: link.name,
      title: `Open ${link.url}`,
      onclick: () => ext.tabs.create({ url: link.url }).catch(() => {}),
    }),
    h('span', { class: 'link-url', text: link.url }),
    h('button', {
      class: 'link-del',
      html: icon('pencil', 11),
      title: 'Edit',
      'aria-label': `Edit ${link.name}`,
      onclick: () => toggleEditForm(row, link),
    }),
    h('button', {
      class: 'link-del',
      html: icon('x', 11),
      title: 'Delete',
      'aria-label': `Delete ${link.name}`,
      onclick: () => {
        update((doc) => (doc.links = doc.links.filter((l) => l.id !== link.id)));
        render('links');
      },
    })
  );
  return row;
}

function toggleEditForm(row, link) {
  const existing = row.querySelector('.link-edit-form');
  if (existing) {
    existing.remove();
    return;
  }
  const nameInput = h('input', { value: link.name, placeholder: 'Name', 'aria-label': 'Alias name' });
  const urlInput = h('input', { value: link.url, placeholder: 'https://…', 'aria-label': 'Alias URL' });
  const save = () => {
    const name = nameInput.value.trim();
    const url = normalizeUrl(urlInput.value);
    if (!name || !url) {
      toast('Enter both a name and a valid URL.');
      return;
    }
    update(() => {
      link.name = name;
      link.url = url;
    });
    render('links');
  };
  row.append(
    h('div', { class: 'link-edit-form' },
      nameInput,
      urlInput,
      h('button', { class: 'accent-btn slim', text: 'Save', onclick: save }),
      h('button', { class: 'settings-btn slim', text: 'Cancel', onclick: (e) => e.target.closest('.link-edit-form').remove() })
    )
  );
  nameInput.focus();
  nameInput.select();
}

function addLink() {
  const nameInput = q('#link-name-input');
  const urlInput = q('#link-url-input');
  const name = nameInput.value.trim();
  const url = normalizeUrl(urlInput.value);
  if (!name || !url) {
    toast('Enter both a name and a valid URL.');
    return;
  }
  update((doc) => doc.links.push({ id: uid(), name, url }));
  nameInput.value = '';
  urlInput.value = '';
  nameInput.focus();
  render('links');
}

export function initLinks() {
  registerRenderer('links', renderLinks);
  q('#btn-add-link').addEventListener('click', addLink);
  q('#link-url-input').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') addLink();
  });
}
