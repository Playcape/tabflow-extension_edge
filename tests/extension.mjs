import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { mkdir, mkdtemp } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const extension = resolve('src');
await mkdir('test-results', {recursive:true});
const profile=await mkdtemp(resolve('test-results/extension-profile-'));
const context = await chromium.launchPersistentContext(profile, {
  headless: true,
  ...(process.env.BROWSER_EXECUTABLE ? {executablePath:process.env.BROWSER_EXECUTABLE} : {}),
  args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`],
});
try {
  const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker', {timeout:15000});
  const origin = worker.url().replace('/background.js', '');
  console.log('Extension worker loaded:', worker.url());
  const page = await context.newPage();
  const errors=[];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m=>{if(m.type()==='error')console.log('Console:',m.text());});
  await page.goto(`${origin}/newtab/newtab.html`);
  await page.waitForSelector('.tab-card');
  await page.click('[data-view="pages"]');
  await page.locator('.page-card').first().click();
  await page.frameLocator('#page-viewer-frame').locator('h1').waitFor();
  await page.evaluate(async()=>{
    const {update,getDoc}=await import('./store.js');
    const {openPage}=await import('./ui/pages.js');
    const p=getDoc().pageSpaces[0].pages[0];
    update(()=>p.content='<h1 id="runtime">Before script</h1><script>document.querySelector("h1").textContent="Script runs"</script>');
    openPage(p.id);
  });
  await page.waitForTimeout(100);
  await page.frameLocator('#page-viewer-frame').getByText('Script runs',{exact:true}).waitFor();
  assert.equal(await page.frameLocator('#page-viewer-frame').locator('body').evaluate(()=>typeof chrome?.runtime?.getURL),'undefined');
  await page.click('#btn-page-viewer-open-tab');
  await page.waitForTimeout(200);
  const host=context.pages().find(p=>p.url().includes('/page-host.html'));
  assert.ok(host,'Standalone Page has a wrapper');
  await host.frameLocator('#page-frame').getByText('Script runs',{exact:true}).waitFor();
  assert.equal(await host.frameLocator('#page-frame').locator('body').evaluate(()=>typeof chrome?.runtime?.getURL),'undefined');
  await page.click('[data-view="collections"]');
  const current=await page.evaluate(()=>chrome.tabs.getCurrent());
  await page.locator('#search-input').blur();
  await worker.evaluate(async windowId=>{await chrome.tabs.create({windowId,url:'edge://newtab/'});},current.windowId);
  await page.waitForTimeout(300);
  console.log('New-tab state:',JSON.stringify(await worker.evaluate(()=>chrome.tabs.query({}).then(tabs=>tabs.map(({id,windowId,url})=>({id,windowId,url}))))));
  await page.waitForFunction(()=>document.activeElement.id==='search-input');
  const windows=await worker.evaluate(async()=>{
    const w=await chrome.windows.create({url:'edge://newtab/'});
    return w.id;
  });
  await page.waitForTimeout(300);
  const all=await worker.evaluate(()=>chrome.tabs.query({}));
  assert.equal(all.filter(t=>t.windowId===current.windowId && t.url?.endsWith('/newtab/newtab.html')).length,1);
  assert.equal(all.filter(t=>t.windowId===windows && t.url?.endsWith('/newtab/newtab.html')).length,1);
  assert.ok(all.some(t=>t.url?.includes('/page-host.html')),'Dedupe preserves standalone Pages');
  const blank=await worker.evaluate(()=>chrome.tabs.create({url:'about:blank'}));
  await page.waitForTimeout(100);
  assert.equal(await worker.evaluate(id=>chrome.tabs.get(id).then(t=>t.url),blank.id),'about:blank');
  const other=context.pages().find(p=>p!==page&&p.url()===page.url());
  assert.ok(other,'Second window workspace available');
  await Promise.all([
    page.evaluate(async()=>{const {update,flush}=await import('./store.js');update(d=>d.links.push({id:'sync-link',name:'sync',url:'https://example.com'}));await flush();}),
    other.evaluate(async()=>{const {update,flush}=await import('./store.js');update(d=>d.tasks.push({id:'sync-task',title:'Concurrent task',done:false}));await flush();})
  ]);
  const synced=await worker.evaluate(()=>chrome.storage.local.get('tabflow_v3').then(v=>v.tabflow_v3));
  assert.ok(synced.links.some(l=>l.id==='sync-link'));
  assert.ok(synced.tasks.some(t=>t.id==='sync-task'));
  await page.screenshot({path:'test-results/extension-pages.png'});
  assert.deepEqual(errors,[]);
  console.log('Extension boot, sandbox scripts/isolation, Page wrapper, new-tab dedupe, activation, new windows, blank tabs and concurrent storage passed.');
} finally { await context.close(); }
