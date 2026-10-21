// Exercise the public map controls: clicks/taps select, one confirmation enters.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const output=fileURLToPath(new URL('../reference/',import.meta.url));
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const page=await browser.newPage({viewport:{width:1000,height:900},hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const formats=[];
try{
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:5174/');
  await page.waitForFunction(()=>!!window.goonk);
  await page.evaluate(()=>{window.goonk.save.unlocked=0;});
  const explorer=page.getByRole('button',{name:/Explorer l’île|Explorer la carte|Carte de l’île/});
  assert.match(await explorer.getAttribute('class'),/primary/);
  await page.screenshot({path:output+'island-explorer-title.png'});
  await explorer.focus();await page.keyboard.press('Enter');
  const map=page.getByRole('group',{name:'Carte de l’île'}),stages=page.locator('.map-stage');
  await map.locator('canvas').waitFor();
  await stages.nth(6).waitFor();
  assert.equal(await stages.count(),7);
  assert.equal(await page.locator('.level-grid,.level-card').count(),0);
  for(let i=0;i<7;i++) {
    assert(await stages.nth(i).isEnabled());
    assert((await stages.nth(i).innerText()).trim().length>4);
  }
  await map.focus();await page.keyboard.press('Home');
  await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');
  assert.equal(await stages.nth(2).getAttribute('aria-pressed'),'true');
  await page.keyboard.press('ArrowLeft');
  assert.equal(await stages.nth(1).getAttribute('aria-pressed'),'true');
  await page.keyboard.press('End');
  assert.equal(await stages.nth(6).getAttribute('aria-pressed'),'true');
  for(const [name,width,height] of [['desktop',1000,900],['portrait',390,844],['portrait-small',320,640],['landscape',844,390]]) {
    await page.setViewportSize({width,height});await page.waitForTimeout(350);
    await stages.nth(3).tap();
    assert.equal(await stages.nth(3).getAttribute('aria-pressed'),'true');
    assert.match(await page.locator('.map-selection').innerText(),/Coral Capers/);
    await page.waitForTimeout(100);
    const rects=await stages.evaluateAll(buttons=>buttons.map(button=>{
      const r=button.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};
    }));
    const mapRect=await map.boundingBox();
    for(let i=0;i<rects.length;i++) {
      const a=rects[i];assert(a.x>=mapRect.x-1&&a.x+a.w<=mapRect.x+mapRect.width+1,`${name}: label ${i} outside map X`);
      assert(a.y>=mapRect.y-1&&a.y+a.h<=mapRect.y+mapRect.height+1,`${name}: label ${i} outside map Y`);
      assert(a.h>=44,`${name}: label ${i} below touch target size`);
      for(let j=i+1;j<rects.length;j++){
        const b=rects[j];assert(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y,`${name}: labels ${i}/${j} overlap`);
      }
    }
    assert(await page.locator('.map-enter').isVisible());
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert.equal(overflow,false);
    await page.screenshot({path:output+`island-map-${name}.png`});
    formats.push({name,visibleNamedStages:7,noOverlap:true,touchTarget:true});
  }
  await page.locator('.map-enter').click();
  await page.waitForFunction(()=>window.goonk.phase==='playing'&&window.goonk.levelId===3);
  await page.locator('.brand').click();await explorer.click();
  await map.focus();await page.keyboard.press('Home');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
  await page.waitForFunction(()=>window.goonk.phase==='playing'&&window.goonk.levelId===1);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({mapCanvas:true,keyboardSelection:true,keyboardEnter:true,allStagesAccessible:true,enterSelectedLevel:true,formats,errors}));
}finally{await browser.close();}
