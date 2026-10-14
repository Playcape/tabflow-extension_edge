import test from 'node:test';
import assert from 'node:assert/strict';

let values = {};
let failRead = false;
let failWrite = false;
let writes = 0;
let payloadOpens = 0;
globalThis.browser = {
  runtime: {getURL: path => `chrome-extension://test/${path}`, getManifest: () => ({permissions:[]})},
  tabs: {},
  storage: {
    local: {
      async get(keys) {
        if (failRead) throw Error('injected read failure');
        return Object.fromEntries((Array.isArray(keys)?keys:[keys]).map(key=>[key,structuredClone(values[key])]));
      },
      async set(next) { if(failWrite) throw Error('injected write failure'); writes++; Object.assign(values,structuredClone(next)); },
      async remove(keys) { for(const key of Array.isArray(keys)?keys:[keys]) delete values[key]; },
    },
    onChanged: {addListener(){}},
  },
};
globalThis.addEventListener = () => {};
globalThis.matchMedia = () => ({matches:false});
globalThis.indexedDB = {open(){payloadOpens++;throw Error('payload storage must not be touched');}};
const {defaultDoc}=await import('../src/newtab/migrations.js');
const store=await import('../src/newtab/store.js');

test('storage failures preserve saved documents, payloads, and snapshot history', async()=>{
  const originalError=console.error;
  console.error=()=>{}; // These failures are deliberately injected.
  try {
    failRead=true;
    await assert.rejects(store.initStore,/injected read failure/);
    assert.equal(writes,0,'failed read must never seed defaults');
    failRead=false;
    values.tabflow_v3=defaultDoc();
    values.tabflow_v3.pageSpaces[0].pages=[{id:'large',title:'Keep me',method:'code',content:'',contentStorage:'indexeddb',contentKey:'large:v1'}];
    values.tabflow_snapshots=[{id:'old-snapshot'}];
    await store.initStore();
    failRead=true;
    await assert.rejects(()=>store.deleteSnapshot('other'),/injected read failure/);
    assert.deepEqual(values.tabflow_snapshots,[{id:'old-snapshot'}]);
    failRead=false;
    failWrite=true;
    await assert.rejects(store.clearAllData,/Could not save the cleared workspace/);
    assert.equal(payloadOpens,0,'failed reset must leave referenced payloads intact');
    assert.equal(values.tabflow_v3.pageSpaces[0].pages[0].contentKey,'large:v1');
    failWrite=false;
    await store.replaceDoc(values.tabflow_v3);
    assert.equal(store.getDoc().pageSpaces[0].pages[0].title,'Keep me');
  } finally { console.error=originalError; }
});
