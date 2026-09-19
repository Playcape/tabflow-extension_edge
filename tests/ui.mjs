import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { serve } from '../scripts/preview.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = await serve(4173);
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? {executablePath:process.env.BROWSER_EXECUTABLE} : {}) });
const page = await browser.newPage({ viewport: {width:1600,height:1000} });
const errors = [];
page.on('pageerror', error => { errors.push(error.message); console.error(error.message); });
page.on('console', message => { if (message.type() === 'error') console.error(message.text()); });
const output = resolve('test-results');
await mkdir(output, {recursive:true});
try {
  await page.goto('http://127.0.0.1:4173/newtab/newtab.html');
  await page.waitForSelector('.tab-card');
  await page.evaluate(async () => {
    const {getDoc, update, flush} = await import('/newtab/store.js');
    const {renderAll} = await import('/newtab/ui/bus.js');
    update(doc => {
      doc.settings.remoteFavicons = false;
      doc.settings.showLinks = true;
      doc.spaces = [{id:'work',name:'Studio workspace',viewMode:'card',collections:[
        {id:'build',name:'Build something great',color:'cyan',tabs:[['Figma','figma.com'],['Linear','linear.app'],['GitHub','github.com'],['Vercel','vercel.com']].map(([title,domain],i)=>({id:'b'+i,title,url:'https://'+domain,pinned:i===0,tags:i===0?['design']:[]}))},
        {id:'inspiration',name:'Ideas worth keeping',color:'purple',tabs:[['Awwwards','awwwards.com'],['Are.na','are.na'],['Read.cv','read.cv'],['The Brand Identity','the-brandidentity.com']].map(([title,domain],i)=>({id:'i'+i,title,url:'https://'+domain}))},
        {id:'learn',name:'A little more curious',tabs:[['MDN Web Docs','developer.mozilla.org'],['Smashing Magazine','smashingmagazine.com'],['CSS Tricks','css-tricks.com']].map(([title,domain],i)=>({id:'l'+i,title,url:'https://'+domain}))}
      ]}, {id:'personal',name:'Personal',viewMode:'card',collections:[]}, {id:'research',name:'Research',viewMode:'card',collections:[]}];
      doc.activeSpaceId='work';
    });
    await flush(); renderAll();
  });
  for (const mode of ['normal','tonal','aurora']) {
    await page.evaluate(async mode => { const {update}=await import('/newtab/store.js'); const {renderAll}=await import('/newtab/ui/bus.js'); update(d=>{d.settings.materialYou=mode==='tonal';d.settings.liquidGlass=mode==='aurora';});renderAll(); },mode);
    await page.waitForTimeout(180);
    assert.equal(await page.locator('body').getAttribute('data-design'), mode);
    await page.screenshot({path:resolve(output,`${mode}-dark.png`)});
    await page.evaluate(async()=>{const {update}=await import('/newtab/store.js');const {renderAll}=await import('/newtab/ui/bus.js');update(d=>d.settings.theme='light');renderAll();});
    await page.waitForTimeout(300); // Capture settled theme transitions.
    await page.screenshot({path:resolve(output,`${mode}-light.png`)});
    await page.evaluate(async()=>{const {update}=await import('/newtab/store.js');const {renderAll}=await import('/newtab/ui/bus.js');update(d=>d.settings.theme='dark');renderAll();});
  }
  // Real controls: each mode must move navigation back and forth without reload.
  await page.click('[data-view="settings"]');
  for (const [label,mode] of [['Normal','normal'],['Tonal','tonal'],['Aurora','aurora']]) {
    await page.getByRole('button', {name:new RegExp('^'+label+' ')}).click();
    assert.equal(await page.locator('body').getAttribute('data-design'),mode);
  }
  await page.screenshot({path:resolve(output,'settings.png')});
  await page.click('[data-view="collections"]');
  // Custom theme/CSS survive every mode; partial themes have stable defaults.
  await page.evaluate(async()=>{
    const {update}=await import('/newtab/store.js'); const {renderAll}=await import('/newtab/ui/bus.js');
    update(d=>{d.settings.customThemes=[{name:'Regression',vars:{'--bg':'#17213a','--text':'#f1f5ff'}}];d.settings.theme='custom_0';d.settings.customCss='body[data-design] #space-breadcrumb { letter-spacing: 2px; }';});renderAll();
  });
  for (const mode of ['normal','tonal','aurora']) {
    await page.evaluate(async mode=>{const {update}=await import('/newtab/store.js');const {renderAll}=await import('/newtab/ui/bus.js');update(d=>{d.settings.materialYou=mode==='tonal';d.settings.liquidGlass=mode==='aurora';});renderAll();},mode);
    assert.equal(await page.locator('html').evaluate(el=>el.style.getPropertyValue('--bg')),'#17213a');
    assert.equal(await page.locator('#space-breadcrumb').evaluate(el=>getComputedStyle(el).letterSpacing),'2px');
  }
  await page.evaluate(async()=>{const {update}=await import('/newtab/store.js');const {renderAll}=await import('/newtab/ui/bus.js');update(d=>{d.settings.theme='dark';d.settings.customCss='';});renderAll();});
  await page.locator('#open-tabs-filter').fill('github');
  assert.equal(await page.locator('#open-tabs-list .tab-row').count(),1);
  await page.locator('#open-tabs-filter').fill('');

  // Keyboard palette, selection semantics, focus trap and focus return.
  await page.click('#btn-command-palette');
  await page.fill('#cmdk-input','Sample Study Guide');
  await page.press('#cmdk-input','Enter');
  await page.frameLocator('#page-viewer-frame').locator('h1').waitFor();
  await page.click('#btn-page-viewer-back');
  await page.click('#btn-add-page');
  await page.fill('#page-edit-title','Regression document');
  await page.fill('#page-edit-code','<main id="app"><h1>Preserved document</h1><p>Content stays intact.</p></main>');
  await page.click('#page-edit-save');
  assert.equal(await page.frameLocator('#page-viewer-frame').locator('#app h1').textContent(),'Preserved document');
  await page.evaluate(async()=>{
    const {update,getDoc}=await import('/newtab/store.js');const {renderPages}=await import('/newtab/ui/pages.js');
    update(d=>{d.pageSpaces.flatMap(s=>s.pages).find(p=>p.title==='Regression document').content='<h1>External edit visible</h1>';});renderPages();
  });
  await page.frameLocator('#page-viewer-frame').getByText('External edit visible',{exact:true}).waitFor();
  await page.click('#btn-page-viewer-back');
  // Failed metadata persistence leaves the editor open; retry keeps one identity.
  await page.evaluate(async()=>{
    const {ext}=await import('/common/ext.js');const {flush}=await import('/newtab/store.js');await flush();
    window.restoreSet=ext.storage.local.set;
    window.restoreError=console.error;console.error=()=>{};
    ext.storage.local.set=async()=>{throw Error('injected save failure');};
  });
  await page.click('#btn-add-page');
  await page.fill('#page-edit-title','Retry once');
  await page.fill('#page-edit-code','<h1>One copy</h1>');
  await page.click('#page-edit-save');
  await page.waitForFunction(()=>document.querySelector('#snackbar').textContent.includes('could not be saved'));
  await page.evaluate(async()=>{const {ext}=await import('/common/ext.js');ext.storage.local.set=window.restoreSet;console.error=window.restoreError;});
  await page.click('#page-edit-save');
  await page.frameLocator('#page-viewer-frame').getByText('One copy',{exact:true}).waitFor();
  assert.equal(await page.evaluate(async()=>{const {getDoc}=await import('/newtab/store.js');return getDoc().pageSpaces.flatMap(s=>s.pages).filter(p=>p.title==='Retry once').length;}),1);
  await page.click('#btn-page-viewer-back');
  await page.click('[data-view="collections"]');
  await page.click('#btn-command-palette');
  await page.press('#cmdk-input','Escape');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'btn-command-palette');
  assert.equal(await page.locator('#app').evaluate(el=>el.inert),false);

  // Native drag events hit the actual delegated collection code.
  const before = await page.evaluate(async()=>{const {getDoc}=await import('/newtab/store.js');return getDoc().spaces[0].collections[1].tabs.length;});
  await page.locator('[data-tab-id="b1"]').dragTo(page.locator('.drop-zone[data-col-id="inspiration"]'),{targetPosition:{x:10,y:10}});
  assert.equal(await page.evaluate(async()=>{const {getDoc}=await import('/newtab/store.js');return getDoc().spaces[0].collections[1].tabs.length;}),before+1);
  await page.locator('#open-tabs-list .tab-row').first().dragTo(page.locator('.drop-zone[data-col-id="build"]'),{targetPosition:{x:10,y:10}});
  assert.equal(await page.evaluate(async()=>{const {getDoc}=await import('/newtab/store.js');return getDoc().spaces[0].collections[0].tabs.some(t=>t.title==='MDN Web Docs');}),true);

  // Large IDB-backed page survives serialization/hydration and inline imports beat stale content.
  await page.evaluate(async()=>{
    const {preparePageContent,resolvePageContent,hydratePageSpaces}=await import('/newtab/pageStorage.js');
    const {update,flush}=await import('/newtab/store.js');
    const content='<h1>Large document</h1>'+' '.repeat(300000);
    const payload=await preparePageContent('large',content);
    if(payload.contentStorage!=='indexeddb')throw Error('Large page not in IndexedDB');
    const p={id:'large',title:'Large document',method:'code',...payload};
    if(await resolvePageContent(p)!==content)throw Error('Payload round trip failed');
    const spaces=await hydratePageSpaces([{id:'large-space',pages:[p]}]);
    if(spaces[0].pages[0].content!==content)throw Error('Hydration failed');
    if(await resolvePageContent({...p,content:'<h1>Imported replacement</h1>'})!=='<h1>Imported replacement</h1>')throw Error('Stale IDB overrode import');
    update(d=>d.pageSpaces.push({id:'large-space',name:'Large pages',pages:[p]}));await flush();
  });
  await page.click('[data-view="settings"]');
  await page.click('[data-stab="data"]');
  const downloadPromise=page.waitForEvent('download');
  await page.click('#btn-export');
  const download=await downloadPromise;
  const {readFile}=await import('node:fs/promises');
  const backup=JSON.parse(await readFile(await download.path(),'utf8'));
  assert.ok(backup.doc.pageSpaces.find(s=>s.id==='large-space').pages[0].content.length>300000);
  await page.locator('#import-file-input').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
  await page.getByRole('button',{name:'Import',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#snackbar').textContent.includes('Backup imported'));
  await page.click('[data-view="collections"]');

  // Many cards: no per-card backdrop blur; the effects budget disables continuous motion.
  const renderMs=await page.evaluate(async()=>{
    const {update}=await import('/newtab/store.js'); const {renderAll}=await import('/newtab/ui/bus.js');
    update(d=>{d.spaces[0].collections[0].tabs=Array.from({length:140},(_,i)=>({id:'stress'+i,title:'Research reference '+i,url:'https://example.com/'+i}));});
    const start=performance.now();renderAll();return performance.now()-start;
  });
  assert.ok(await page.locator('#collections-area .tab-card').count()>=140);
  assert.ok(await page.locator('body').evaluate(el=>el.classList.contains('effects-static')));
  assert.equal(await page.locator('.tab-card').first().evaluate(el=>getComputedStyle(el).backdropFilter),'none');
  assert.ok(renderMs<1500,`140-card render took ${renderMs}ms`);
  await page.locator('#search-input').fill('reference 139');
  assert.equal(await page.locator('#collections-area .tab-card').count(),1);
  await page.locator('#search-input').fill('');
  await page.emulateMedia({reducedMotion:'reduce',contrast:'more'});
  assert.ok(await page.locator('body').evaluate(el=>el.classList.contains('effects-opaque')));
  assert.equal(await page.locator('#sidebar').evaluate(el=>getComputedStyle(el).backdropFilter),'none');
  await page.emulateMedia({reducedMotion:'no-preference',contrast:'no-preference'});
  await page.emulateMedia({forcedColors:'active'});
  assert.ok(await page.locator('body').evaluate(el=>el.classList.contains('effects-opaque')));
  await page.emulateMedia({forcedColors:'none'});
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-transparency',value:'reduce'}]});
  await page.waitForFunction(()=>document.body.classList.contains('effects-opaque'));
  assert.equal(await page.locator('#sidebar').evaluate(el=>getComputedStyle(el).backdropFilter),'none');
  await cdp.send('Emulation.setEmulatedMedia',{features:[]});
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.locator('#sidebar').evaluate(el=>el.inert),true);
  await page.click('#workspace-sidebar-toggle');
  assert.equal(await page.locator('#sidebar').evaluate(el=>el.inert),false);
  await page.click('#btn-sidebar-toggle');
  assert.ok(await page.locator('#search-input').isVisible());
  await page.screenshot({path:resolve(output,'mobile.png')});
  await page.setViewportSize({width:1024,height:768});
  await page.screenshot({path:resolve(output,'laptop.png')});
  assert.deepEqual(errors, []);
  await writeFile(resolve(output,'ui-results.json'),JSON.stringify({errors,browser:browser.version(),modes:3,render140CardsMs:renderMs,checks:['mode controls','custom theme/CSS','Pages','palette','focus return','native drag','open tabs','IDB round trip','export/import','140 cards','search','reduced motion/contrast/transparency','forced colors','responsive']},null,2));
  console.log('UI mode smoke passed; screenshots in test-results');
} catch (error) { await page.screenshot({path:resolve(output,'failure.png')}); throw error; }
finally { await browser.close(); await new Promise(resolve=>server.close(resolve)); }
