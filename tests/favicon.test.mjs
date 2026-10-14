import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';

let granted = [];
let supported = true;
let accept = true;
let fail = false;
const requests = [];
const added = [];
const removed = [];
globalThis.browser = {
  runtime: {
    getURL: (path) => `moz-extension://tabflow/${path}`,
    getManifest: () => ({ permissions: [] }),
  },
  tabs: {},
  permissions: {
    async getAll() { return supported ? { data_collection: granted } : {}; },
    async request(permission) {
      requests.push(permission);
      if (fail) throw new Error('Permission service unavailable');
      if (accept) granted = permission.data_collection;
      return accept;
    },
    async remove() {
      granted = [];
      removed.forEach(fn => fn({ data_collection: ['browsingActivity'] }));
      return true;
    },
    onAdded: { addListener: fn => added.push(fn) },
    onRemoved: { addListener: fn => removed.push(fn) },
  },
};
const consent = await import('../src/common/faviconConsent.js');
const { faviconSrc } = await import('../src/common/util.js');

beforeEach(async () => {
  granted = [];
  supported = true;
  accept = true;
  fail = false;
  requests.length = added.length = removed.length = 0;
  await consent.initFaviconConsent();
});

test('Firefox blocks stored remote icons and Google requests before consent, retaining local images', () => {
  assert.equal(faviconSrc('https://private.test', 'https://private.test/icon.png', true), '');
  assert.equal(faviconSrc('https://private.test', '', true), '');
  assert.equal(faviconSrc('https://private.test', 'data:image/png;base64,AA==', true), 'data:image/png;base64,AA==');
  // Restoring a workspace with remoteFavicons=true cannot grant permission.
  assert.equal(consent.remoteIconsAllowed(), false);
});

test('user consent starts the permission request synchronously and enables remote icons', async () => {
  const result = consent.requestFaviconConsent();
  assert.deepEqual(requests, [{ data_collection: ['browsingActivity'] }]);
  assert.equal(await result, true);
  assert.equal(faviconSrc('https://private.test', 'https://private.test/icon.png', true), 'https://private.test/icon.png');
  assert.match(faviconSrc('https://private.test', '', true), /google\.com\/s2\/favicons\?domain=private.test/);
  assert.equal(faviconSrc('https://private.test', '', false), '');
});

test('denied or failed consent leaves remote favicon transmission disabled', async () => {
  accept = false;
  assert.equal(await consent.requestFaviconConsent(), false);
  fail = true;
  assert.equal(await consent.requestFaviconConsent(), false);
  assert.equal(faviconSrc('https://private.test', '', true), '');
});

test('permission revocation immediately blocks requests and refreshes open tabs', async () => {
  let changes = 0;
  added.length = removed.length = 0;
  await consent.initFaviconConsent(() => changes++);
  await consent.requestFaviconConsent();
  removed.forEach(fn => fn({ data_collection: ['browsingActivity'] }));
  assert.equal(faviconSrc('https://private.test', 'https://private.test/icon.png', true), '');
  assert.equal(changes, 1);
  added.forEach(fn => fn({ data_collection: ['browsingActivity'] }));
  assert.equal(consent.remoteIconsAllowed(), true);
  await consent.removeFaviconConsent();
  assert.equal(consent.remoteIconsAllowed(), false);
});

test('Firefox versions without built-in consent cannot request or load remote icons', async () => {
  supported = false;
  await consent.initFaviconConsent();
  assert.equal(await consent.requestFaviconConsent(), false);
  assert.equal(requests.length, 0);
  assert.equal(faviconSrc('https://private.test', '', true), '');
});

test('previously granted Firefox consent is restored on page startup', async () => {
  granted = ['browsingActivity'];
  await consent.initFaviconConsent();
  assert.equal(consent.remoteIconsAllowed(), true);
});
