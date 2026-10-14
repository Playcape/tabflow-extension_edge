import test, { before } from 'node:test';
import assert from 'node:assert/strict';

const events = {
  created: [],
  updated: [],
  removed: [],
  commands: [],
  inputChanged: [],
  inputEntered: [],
  action: [],
  installed: [],
};
const listener = (name) => ({
  addListener(fn) { events[name].push(fn); },
  removeListener(fn) {
    const index = events[name].indexOf(fn);
    if (index >= 0) events[name].splice(index, 1);
  },
});

let tabs = [];
const updates = [];
const removed = [];
const windowUpdates = [];

const storageValues = {};
const browser = {
  runtime: {
    getURL(path) { return `chrome-extension://tabflow/${path}`; },
    getManifest() { return { permissions: [] }; },
    onInstalled: listener('installed'),
  },
  storage: {
    local: {
      async get(keys) {
        if (typeof keys === 'string') return { [keys]: storageValues[keys] };
        return Object.fromEntries((keys ?? Object.keys(storageValues)).map((key) => [key, storageValues[key]]));
      },
      async set(values) { Object.assign(storageValues, values); },
      async remove(keys) { for (const key of (Array.isArray(keys) ? keys : [keys])) delete storageValues[key]; },
    },
    onChanged: listener('changed'),
  },
  tabs: {
    async get(id) { return tabs.find((tab) => tab.id === id) ?? null; },
    async query(query = {}) {
      return tabs.filter((tab) => query.windowId == null || tab.windowId === query.windowId);
    },
    async update(id, change) {
      const tab = tabs.find((candidate) => candidate.id === id);
      updates.push({ id, change });
      if (tab) Object.assign(tab, change);
      return tab ?? null;
    },
    async remove(id) {
      removed.push(id);
      tabs = tabs.filter((tab) => tab.id !== id);
    },
    async sendMessage(id, message) { updates.push({ id, message }); },
    onCreated: listener('created'),
    onUpdated: listener('updated'),
    onRemoved: listener('removed'),
  },
  windows: {
    async update(id, change) { windowUpdates.push({ id, change }); },
  },
  commands: { onCommand: listener('commands') },
  omnibox: { onInputChanged: listener('inputChanged'), onInputEntered: listener('inputEntered') },
  action: { onClicked: listener('action') },
};

globalThis.browser = browser;

let ext;
let newtabPage;
let onCreated;
let onUpdated;

before(async () => {
  ({ NEWTAB_PAGE: newtabPage } = await import('../src/common/ext.js?background-test'));
  await import('../src/background.js?background-test');
  ({ ext } = await import('../src/common/ext.js?background-test')); // retained for a clear test fixture contract
  onCreated = events.created[0];
  onUpdated = events.updated[0];
  assert.ok(onCreated);
  assert.ok(onUpdated);
});

const settle = () => new Promise((resolve) => setImmediate(resolve));

test('redirects a browser new-tab surface to the TabFlow page', async () => {
  tabs = [{ id: 10, windowId: 1, url: 'chrome://newtab/' }];
  updates.length = 0;

  await onCreated(tabs[0]);

  assert.deepEqual(updates, [{ id: 10, change: { url: newtabPage } }]);
  assert.equal(tabs[0].url, newtabPage);
});

test('deduplicates a second new-tab surface while preserving the existing TabFlow tab', async () => {
  tabs = [
    { id: 20, windowId: 2, url: newtabPage },
    { id: 21, windowId: 2, url: 'edge://newtab/' },
  ];
  updates.length = 0;
  removed.length = 0;
  windowUpdates.length = 0;

  await onCreated(tabs[1]);

  assert.deepEqual(removed, [21]);
  assert.ok(updates.some(({ id, change }) => id === 20 && change.active === true));
  assert.deepEqual(windowUpdates, [{ id: 2, change: { focused: true } }]);
  assert.equal(tabs.some((tab) => tab.id === 20), true);
});

test('serializes overlapping lifecycle events and chooses the lowest TabFlow id', async () => {
  tabs = [
    { id: 30, windowId: 3, url: newtabPage },
    { id: 31, windowId: 3, url: newtabPage },
    { id: 32, windowId: 3, url: 'about:newtab' },
  ];
  updates.length = 0;
  removed.length = 0;

  // Both callbacks are launched before either reconciliation completes.
  await Promise.all([onCreated(tabs[1]), onCreated(tabs[2])]);
  await settle();

  assert.deepEqual(removed.sort((a, b) => a - b), [31, 32]);
  assert.equal(tabs.map((tab) => tab.id).join(','), '30');
  assert.ok(updates.some(({ id, change }) => id === 30 && change.active === true));
});

test('updated events reconcile only URL or completion lifecycle changes', async () => {
  tabs = [{ id: 40, windowId: 4, url: 'chrome://newtab/' }];
  updates.length = 0;

  await onUpdated(40, {}, tabs[0]);
  assert.deepEqual(updates, []);
  await onUpdated(40, { url: tabs[0].url }, tabs[0]);
  assert.equal(tabs[0].url, newtabPage);
});
