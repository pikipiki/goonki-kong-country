// Public UI only: fullscreen ROM map, explicit rendering choice and no leaked 2D mode.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const output=fileURLToPath(new URL('../reference/',import.meta.url));
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const report={formats:[],allSeven3D:[],twoDDestinations:[],englishDefault:false};
try{
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:5174/');
 await page.waitForFunction(()=>!!window.goonk);
 assert.equal(await page.locator('html').getAttribute('lang'),'en');report.englishDefault=true;
 assert.match(await page.locator('.demo-2d-choices').innerText(),/Jungle.*final boss/s);
 assert.equal(await page.locator('.demo-2d-choices button').count(),2);
 await page.locator('.demo-2d-choices button').nth(0).click();
 await page.waitForFunction(()=>window.goonk.phase==='playing'&&window.goonk.levelId===0);
 assert(await page.locator('.app.demo-2d').count());
 await page.getByRole('button',{name:'Explore the island',exact:true}).click();
 const map=page.locator('.island-map'),stages=page.locator('.map-stage');
 await stages.nth(6).waitFor();
 for(const [name,width,height] of [['portrait',390,844],['portrait-small',320,640],['landscape',844,390]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(350);
  const bounds=await map.boundingBox();assert.equal(bounds.x,0);assert.equal(bounds.y,0);assert.equal(bounds.width,width);assert.equal(bounds.height,height);
  const rects=await stages.evaluateAll(bs=>bs.map(b=>{const r=b.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,name:b.innerText};}));
  const footer=await page.locator('.map-confirm').boundingBox();
  for(let i=0;i<7;i++){
   const a=rects[i];assert(a.name.length>4);assert(a.h>=43.99);assert(a.w>=43.99);assert(a.x>=0&&a.x+a.w<=width);assert(a.y>=0&&a.y+a.h<footer.y);
   for(const b of rects.slice(i+1))assert(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y,`${name}: overlapping labels`);
   await stages.nth(i).tap();assert.equal(await stages.nth(i).getAttribute('aria-pressed'),'true');
  }
  await page.screenshot({path:output+`island-map-2d-${name}.png`});
  report.formats.push({name,fullscreen:true,namedTouchTargets:7,noOverlap:true});
 }
 const choice2D=page.locator('.map-mode-buttons button').filter({hasText:/^2D$/});
 const choice3D=page.locator('.map-mode-buttons button').filter({hasText:/^3D$/});
 for(let id=0;id<7;id++){
  await stages.nth(id).tap();
  assert.equal(await choice2D.isEnabled(),id===0||id===6);
  await choice3D.click();await page.locator('.map-enter').click();
  await page.waitForFunction(id=>window.goonk.phase==='playing'&&window.goonk.levelId===id,id);
  assert.equal(await page.locator('.app.demo-2d').count(),0);
  assert.equal(await page.locator('[aria-label="3D game scene"] canvas').count(),1);
  report.allSeven3D.push(id);
  await page.getByRole('button',{name:'Explore the island',exact:true}).click();await stages.nth(6).waitFor();
 }
 for(const id of [0,6]){
  await stages.nth(id).tap();await choice2D.click();await page.locator('.map-enter').click();
  await page.waitForFunction(id=>window.goonk.phase==='playing'&&window.goonk.levelId===id,id);
  assert.equal(await page.locator('.app.demo-2d').count(),1);
  assert.equal(await page.locator('.scene-2d-canvas').count(),1);
  if(id===6)assert.equal(await page.locator('canvas[aria-label="Gangplank Galleon 2D"]').count(),1);
  report.twoDDestinations.push(id);
  await page.getByRole('button',{name:'Explore the island',exact:true}).click();await stages.nth(6).waitFor();
 }
 // Keyboard selects the final boss; the visible 3D choice is honored by Enter.
 await choice3D.click();await map.focus();await page.keyboard.press('End');await page.keyboard.press('Enter');
 await page.waitForFunction(()=>window.goonk.phase==='playing'&&window.goonk.levelId===6);
 assert.equal(await page.locator('.app.demo-2d').count(),0);
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({...report,keyboardRendererChoice:true,errors}));
}finally{await browser.close();}
