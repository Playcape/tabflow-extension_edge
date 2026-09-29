import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import {serve} from '../scripts/preview.mjs';
const require = createRequire(import.meta.url);
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = await serve(4174);
const browser = await chromium.launch({headless:true, ...(process.env.BROWSER_EXECUTABLE ? {executablePath:process.env.BROWSER_EXECUTABLE} : {})});
const page = await browser.newPage({viewport:{width:2100,height:1200}});
const errors=[];
page.on('pageerror', error=>errors.push(error.message));
await mkdir('test-results',{recursive:true});
const order = () => page.evaluate(async()=>{const {activeSpace}=await import('/newtab/store.js');return activeSpace().collections.map(c=>c.id);});
async function geometry(previewId) {
  return page.locator('#collections-area > .collection:not(.collection-drag-source)').evaluateAll((els,id)=>els.map(el=>{
    const r=el.getBoundingClientRect();return {id:el.dataset.id || id,x:r.x,y:r.y,height:r.height,width:r.width};
  }),previewId);
}
async function startDrag(id,targetId) {
  const source=await page.locator(`.collection[data-id="${id}"] .col-drag-handle`).boundingBox();
  const target=await page.locator(`.collection[data-id="${targetId}"]`).boundingBox();
  await page.mouse.move(source.x+source.width/2,source.y+source.height/2);
  await page.mouse.down();
  await page.waitForTimeout(60);
  await page.mouse.move(source.x+source.width/2+12,source.y+source.height/2+12,{steps:5});
  await page.waitForTimeout(60);
  await page.mouse.move(target.x+target.width/2,target.y+target.height-8,{steps:12});
  await page.mouse.move(target.x+target.width/2,target.y+target.height-7);
  await page.waitForSelector('.collection-drop-preview',{timeout:5000});
  const landing=await page.locator('.collection-drop-preview').boundingBox();
  await page.mouse.move(landing.x+landing.width/2,landing.y+Math.min(landing.height/2,40));
  await page.mouse.move(landing.x+landing.width/2+1,landing.y+Math.min(landing.height/2,40));
}
try {
  await page.goto('http://127.0.0.1:4174/newtab/newtab.html');
  await page.waitForSelector('.tab-card');
  await page.evaluate(async()=>{
    const {update,replaceDoc,getDoc}=await import('/newtab/store.js');const {renderAll}=await import('/newtab/ui/bus.js');
    update(d=>{d.settings.remoteFavicons=false;d.settings.liquidGlass=true;d.settings.materialYou=false;
      d.spaces=[{id:'packing',name:'Packing fixture',viewMode:'card',collections:[1,12,3,2,5,0].map((count,i)=>({id:`c${i}`,name:`Collection ${i+1}`,tabs:Array.from({length:count},(_,j)=>({id:`t${i}-${j}`,title:`Reference ${j+1}`,url:`https://example.com/${i}/${j}`}))}))}];d.activeSpaceId='packing';});
    await replaceDoc(getDoc());renderAll();
  });
  for (const mode of ['aurora','tonal','normal']) {
    await page.evaluate(async mode=>{const {update,flush}=await import('/newtab/store.js');const {renderAll}=await import('/newtab/ui/bus.js');update(d=>{d.settings.liquidGlass=mode==='aurora';d.settings.materialYou=mode==='tonal';});await flush();renderAll();},mode);
    await page.waitForTimeout(150);
    const initial=await order();
    const positions=await geometry();
    if(mode==='aurora') {
      assert.equal(positions[0].x,positions[2].x);
      assert.ok(Math.abs(positions[2].y-positions[0].y-positions[0].height-20)<2,'Short column packs immediately below its predecessor');
      assert.ok(positions[2].y<positions[1].y+positions[1].height,'No shared tall-row gap');
    }
    await startDrag(initial[0],initial[1]);
    assert.deepEqual(await order(),initial,'Preview must not write the document');
    const preview=await geometry(initial[0]);
    assert.notDeepEqual(preview.map(p=>p.id),initial,'The preview changes the visible arrangement');
    await page.screenshot({path:`test-results/collection-drag-${mode}.png`});
    await page.mouse.up();
    await page.waitForTimeout(100);
    await page.locator('#collections-area').evaluate(el=>Promise.all(el.getAnimations({subtree:true}).map(animation=>animation.finished.catch(()=>{}))));
    assert.deepEqual(await order(),preview.map(p=>p.id),'Drop commits exactly the preview order');
    const result=await geometry();
    for(let i=0;i<result.length;i++) for(const key of ['x','y','width','height']) {
      assert.ok(Math.abs(result[i][key]-preview[i][key])<2,`${mode}: preview footprint differs for ${result[i].id}.${key}`);
    }
    assert.equal(await page.locator('.collection-drop-preview,.collection-drag-source').count(),0);
    // Native Escape cancellation restores both order and source visibility.
    const saved=await order();
    await startDrag(saved[0],saved[1]);
    await page.keyboard.press('Escape');await page.mouse.up();
    await page.waitForTimeout(100);
    assert.deepEqual(await order(),saved);
    assert.equal(await page.locator('.collection-drop-preview,.collection-drag-source').count(),0);
  }
  await page.evaluate(async()=>{const {update}=await import('/newtab/store.js');const {renderAll}=await import('/newtab/ui/bus.js');update(d=>{d.settings.liquidGlass=true;d.settings.materialYou=false;});renderAll();});
  await page.setViewportSize({width:1000,height:800});
  await page.waitForFunction(()=>!document.querySelector('#collections-area').hasAttribute('data-masonry'),{},{timeout:5000});
  assert.equal(await page.locator('#collections-area').getAttribute('data-masonry'),null,'Narrow layout clears packing cells');
  await page.setViewportSize({width:2100,height:1200});
  await page.waitForFunction(()=>document.querySelector('#collections-area').hasAttribute('data-masonry'),{},{timeout:5000});
  const firstId=(await order())[0];
  await page.locator(`.collection[data-id="${firstId}"] .col-chevron`).click();
  await page.waitForTimeout(100);
  const collapsed=await geometry();
  const first=collapsed[0];const nextInColumn=collapsed.slice(1).find(p=>Math.abs(p.x-first.x)<1);
  assert.ok(Math.abs(nextInColumn.y-first.y-first.height-20)<2,'Collapse repacks remaining items');
  await page.locator('#search-input').fill('Reference 1');await page.waitForTimeout(100);
  const heading=await page.locator('.search-results-hd').boundingBox();
  assert.ok((await geometry()).every(p=>p.y>=heading.y+heading.height),'Search heading spans every column');
  assert.deepEqual(errors,[]);
  console.log('Collection packing, native drag preview/drop/cancel in three modes, resize, collapse and search passed.');
} catch(error) {await page.screenshot({path:'test-results/collection-failure.png'});throw error;}
finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
