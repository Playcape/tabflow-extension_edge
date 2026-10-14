import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';

globalThis.browser = {
  runtime: {
    getURL(path) { return `chrome-extension://tabflow/${path}`; },
    getManifest() { return { permissions: [] }; },
  },
  tabs: {},
};

const { normalizeDoc, migrateV2, parseImport } = await import('../src/newtab/migrations.js?data-test');
const { mergeDocuments } = await import('../src/newtab/merge.js?data-test');

test('normalizes unsafe data and repairs settings, references, and page payload metadata', () => {
  const doc = normalizeDoc({
    schemaVersion: 3,
    spaces: [{ id: 'space', name: 'Workspace', viewMode: 'unknown', collections: [{
      id: 'collection', name: 'Links', sort: 'domain', tabs: [
        { id: 'safe', url: 'example.com', title: '', favicon: 'javascript:bad', hotkey: { slot: 2 }, tags: ['one', '', 5] },
        { id: 'unsafe', url: 'javascript:alert(1)', title: 'Keep title' },
      ],
    }] }],
    activeSpaceId: 'missing',
    pageSpaces: [{ id: 'pages', name: 'Docs', pages: [{ id: 'p', title: 'Read me', method: 'code', content: '<p>x</p>', contentStorage: 'indexeddb', contentKey: 'payload' }] }],
    activePageSpaceId: 'missing',
    links: [{ id: 'link', name: ' docs ', url: 'docs.example.com' }, { name: '', url: 'https://ignored.example' }, { name: 'bad', url: 'javascript:x' }],
    tasks: [{ id: 'task', title: '  ship  ', url: 'example.com', done: 1 }, { title: '', url: 'https://ignored.example' }],
    settings: { defaultView: 'list', borderRadius: 99, sidebarWidth: 10, lgBlur: 0, liquidGlass: true, materialYou: true },
    ui: { sidebarOpen: false },
  });

  const collection = doc.spaces[0].collections[0];
  assert.equal(doc.activeSpaceId, 'space');
  assert.equal(collection.viewMode, undefined); // viewMode belongs to a space, not a collection
  assert.equal(doc.spaces[0].viewMode, 'list');
  assert.deepEqual(collection.tabs[0], { id: 'safe', title: 'example.com', url: 'https://example.com/', favicon: '', hotkeySlot: 2, tags: ['one'] });
  assert.equal(collection.tabs[1].url, '');
  assert.equal(doc.links.length, 1);
  assert.deepEqual(doc.links[0], { id: 'link', name: 'docs', url: 'https://docs.example.com/' });
  assert.deepEqual(doc.tasks[0], { id: 'task', title: 'ship', url: 'https://example.com/', done: true });
  assert.equal(doc.activePageSpaceId, 'pages');
  assert.equal(doc.pageSpaces[0].pages[0].contentStorage, 'indexeddb');
  assert.equal(doc.pageSpaces[0].pages[0].contentKey, 'payload');
  assert.equal(doc.settings.borderRadius, 20);
  assert.equal(doc.settings.sidebarWidth, 160);
  assert.equal(doc.settings.lgBlur, 0);
  assert.equal(doc.settings.liquidGlass, false);
  assert.equal(doc.ui.sidebarOpen, false);
  assert.equal(doc.ui.rightPanelOpen, true);
});

test('migrates legacy v2 view modes, tasks, fonts, and settings', () => {
  const doc = migrateV2({
    spaces: [{ id: 's', name: 'One', collections: [] }],
    activeSpaceId: 's',
    viewModes: { s: 'grid' },
    nextItems: [{ id: 't', title: 'Next', url: 'example.org' }],
    font: 'JetBrains Mono',
    cardDensity: 'compact',
    showClock: 'on',
  });
  assert.equal(doc.spaces[0].viewMode, 'grid');
  assert.equal(doc.tasks[0].title, 'Next');
  assert.equal(doc.tasks[0].url, 'https://example.org/');
  assert.equal(doc.settings.font, 'mono');
  assert.equal(doc.settings.density, 'compact');
  assert.equal(doc.settings.showClock, true);
});

test('accepts export envelopes and rejects malformed imports', () => {
  const source = normalizeDoc({ spaces: [{ id: 's', name: 'S', collections: [] }] });
  const imported = parseImport(JSON.stringify({ app: 'tabflow', doc: source }));
  assert.equal(imported.spaces[0].id, 's');
  assert.equal(parseImport('{bad json'), null);
  assert.equal(parseImport(JSON.stringify({ nope: true })), null);
});

test('three-way merges field edits while retaining independent additions and making deletion win', () => {
  const base = {
    spaces: [{ id: 's', name: 'Space', collections: [{ id: 'c', name: 'C', tabs: [
      { id: 'a', title: 'A', url: 'https://a.test' },
      { id: 'b', title: 'B', url: 'https://b.test' },
    ] }] }],
    links: [{ id: 'base-link', name: 'Base', url: 'https://base.test' }],
  };
  const local = structuredClone(base);
  local.spaces[0].collections[0].tabs[0].title = 'Local title';
  local.spaces[0].collections[0].tabs.splice(1, 1);
  local.links.push({ id: 'local-link', name: 'Local', url: 'https://local.test' });
  const remote = structuredClone(base);
  remote.spaces[0].collections[0].tabs[0].url = 'https://remote.test';
  remote.spaces[0].collections[0].tabs.push({ id: 'remote-tab', title: 'Remote', url: 'https://remote.test' });
  remote.links[0].name = 'Remote base';

  const merged = mergeDocuments(base, local, remote);
  const tabs = merged.spaces[0].collections[0].tabs;
  assert.deepEqual(tabs.find((tab) => tab.id === 'a'), { id: 'a', title: 'Local title', url: 'https://remote.test' });
  assert.equal(tabs.some((tab) => tab.id === 'b'), false);
  assert.equal(tabs.some((tab) => tab.id === 'remote-tab'), true);
  assert.equal(merged.links.some((link) => link.id === 'local-link'), true);
  assert.equal(merged.links.find((link) => link.id === 'base-link').name, 'Remote base');
});

// A tiny asynchronous IndexedDB double exercises transaction completion and
// request errors, which is the part most likely to regress in pageStorage.
class FakeRequest {
  result = undefined;
  error = null;
  onsuccess = null;
  onerror = null;
}
class FakeTransaction {
  oncomplete = null;
  onabort = null;
  onerror = null;
  constructor(records, mode) { this.records = records; this.mode = mode; }
  objectStore() {
    const records = this.records;
    const schedule = (request, result) => {
      queueMicrotask(() => {
        request.result = result;
        request.onsuccess?.();
        queueMicrotask(() => this.oncomplete?.());
      });
      return request;
    };
    return {
      put: (record) => {
        const request = new FakeRequest();
        if (this.mode === 'readonly') {
          request.error = new Error('readonly');
          queueMicrotask(() => this.onerror?.());
          return request;
        }
        records.set(record.id, structuredClone(record));
        return schedule(request, record);
      },
      get: (id) => schedule(new FakeRequest(), records.get(id) ? structuredClone(records.get(id)) : undefined),
      delete: (id) => { records.delete(id); return schedule(new FakeRequest(), undefined); },
      clear: () => { records.clear(); return schedule(new FakeRequest(), undefined); },
    };
  }
}
class FakeDb {
  constructor(records) {
    this.records = records;
    this.objectStoreNames = { contains: (name) => name === 'html_pages' };
  }
  createObjectStore() { return {}; }
  transaction(name, mode) { assert.equal(name, 'html_pages'); return new FakeTransaction(this.records, mode); }
  close() {}
}

let records;
let db;
before(() => {
  records = new Map();
  db = new FakeDb(records);
  globalThis.indexedDB = {
    open() {
      const request = new FakeRequest();
      queueMicrotask(() => { request.result = db; request.onupgradeneeded?.(); request.onsuccess?.(); });
      return request;
    },
  };
});

test('page storage commits, reads, hydrates, and clears payloads through transactions', async () => {
  const pages = await import('../src/newtab/pageStorage.js?data-test');
  assert.equal(await pages.savePageContent('p1', '<h1>Stored</h1>'), true);
  assert.equal(await pages.getPageContent('p1'), '<h1>Stored</h1>');
  assert.equal(await pages.getPageContent('missing'), '');
  await assert.rejects(() => pages.getPageContent('missing', '', { strict: true }), /missing from local storage/);

  const hydrated = await pages.hydratePageSpaces([{ id: 'ps', pages: [
    { id: 'p1', title: 'Payload', content: '...[large]', contentStorage: 'indexeddb', contentKey: 'p1' },
    { id: 'p2', title: 'Inline', content: '<p>inline</p>', contentStorage: 'indexeddb', contentKey: 'never' },
  ] }]);
  assert.deepEqual(hydrated[0].pages, [
    { id: 'p1', title: 'Payload', content: '<h1>Stored</h1>' },
    { id: 'p2', title: 'Inline', content: '<p>inline</p>' },
  ]);
  await pages.clearPageContents();
  assert.equal(await pages.getPageContent('p1'), '');
});

after(() => { delete globalThis.indexedDB; });
