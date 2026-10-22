import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const output = fileURLToPath(new URL('../reference/', import.meta.url));
const browser = await chromium.launch({headless: true, executablePath: process.env.BROWSER_EXECUTABLE || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const page = await browser.newPage({viewport: {width: 844, height: 390}, hasTouch: true, isMobile: true});
const errors=[];
page.on('pageerror', e=>errors.push(e.message));
page.on('console', m=>{if(m.type()==='error')errors.push(m.text());});
try {
  await page.goto(process.env.GAME_URL || 'http://127.0.0.1:5174/');
  await page.locator('.lang-select-input').selectOption('fr');
  await page.waitForFunction(() => document.documentElement.lang === 'fr');
  await page.getByRole('button', {name:'Commencer l’aventure'}).click();
  for(const [level,index,kind] of [[0,0,'rambi'],[1,0,'winky'],[3,0,'enguarde'],[4,0,'expresso']]) {
    // Controlled start beside the crate; release, mounting and actions use input.
    await page.evaluate(([level,index])=>{
      const g=window.goonk; g.start(level);g.enemies=[];
      const a=g.animals[index]; Object.assign(g.player,{x:a.x,y:a.y,vy:0,vx:0,grounded:true});
    },[level,index]);
    await page.waitForTimeout(120);
    if(kind!=='enguarde') await page.keyboard.press('KeyX');
    await page.waitForTimeout(120);
    if(kind!=='enguarde') assert.equal(await page.evaluate(i=>window.goonk.animals[i].state,index),'idle');
    if(kind!=='enguarde') {
      await page.keyboard.down('Space');await page.waitForTimeout(200);await page.keyboard.up('Space');
    }
    await page.waitForFunction(kind=>window.goonk.mount?.kind===kind,kind,{timeout:2500});
    await page.getByRole('button',{name:'Descendre',exact:true}).waitFor({state:'visible'});
    if(kind==='enguarde') {
      const y=await page.evaluate(()=>window.goonk.player.y);
      const up=page.getByRole('button',{name:'Nager vers le haut'});
      const rect=await up.boundingBox(); await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.down();
      await page.waitForTimeout(220);
      await page.mouse.up();
      assert((await page.evaluate(()=>window.goonk.player.y))>y+0.2);
      await page.keyboard.down('KeyX');await page.waitForTimeout(60);
      assert((await page.evaluate(()=>window.goonk.player.mountAttack))>0);
      await page.keyboard.up('KeyX');
    }
    await page.screenshot({path:output+`buddy-${kind}-landscape.png`});
    if(kind==='rambi'||kind==='enguarde') {
      await page.setViewportSize({width:390,height:844});await page.waitForTimeout(250);
      await page.screenshot({path:output+`buddy-${kind}-portrait.png`});
      await page.setViewportSize({width:844,height:390});
    }
    await page.getByRole('button',{name:'Descendre',exact:true}).click();
    await page.waitForTimeout(120);
    assert.equal(await page.evaluate(()=>window.goonk.player.mount),-1);
  }
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({mounted:['rambi','winky','enguarde','expresso'],dismounts:4,marineVertical:true,marineAttack:true,errors}));
} finally { await browser.close(); }
