// Regression harness: UI navigation is real; controlled deaths/restarts isolate
// renderer identity and visibility. This is not a full human playthrough.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const out = fileURLToPath(new URL('../reference/',import.meta.url));
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const result=[];
try {
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:5174/');
  await page.waitForFunction(()=>!!window.goonk);
  assert.equal(await page.evaluate(()=>window.goonk.save.unlocked),0);
  for(const [orientation,width,height] of [['portrait',390,844],['landscape',844,390]]) {
    await page.setViewportSize({width,height});
    for(let id=0;id<7;id++) {
      await page.locator('.brand').click();
      await page.getByRole('button',{name:/Explorer l’île|Explorer la carte|Carte de l’île/}).click();
      const cards=page.locator('.level-card');assert.equal(await cards.count(),7);
      for(let n=0;n<7;n++) assert(await cards.nth(n).isEnabled());
      await cards.nth(id).click();
      if(id===6 && orientation==='portrait') await page.screenshot({path:out+'bugfix-map-portrait.png',fullPage:true});
      await page.locator('.map-enter').click();
      await page.waitForFunction(id=>window.goonk.phase==='playing'&&window.goonk.levelId===id,id);
      await page.waitForTimeout(450);
      const actorState=await page.evaluate(()=>{
        const game=window.goonk, objects=[];
        window.goonkScene.traverse(o=>{if(o.name==='enemy')objects.push(o);});
        return {count:objects.length,expected:game.enemies.length,current:objects.every(o=>game.enemies.includes(o.userData.enemy))};
      });
      assert.equal(actorState.count,actorState.expected);assert(actorState.current);
      if(id!==6) {
        await page.evaluate(()=>{const enemy=window.goonk.enemies[0];enemy.alive=false;enemy.hp=0;enemy.hurt=1;});
        for(let frame=0;frame<6;frame++) {
          await page.waitForTimeout(45);
          const visible=await page.evaluate(()=>{
            let found=false;window.goonkScene.traverse(o=>{if(o.name==='enemy'&&o.userData.enemy===window.goonk.enemies[0])found=o.visible;});return found;
          });
          assert.equal(visible,false,`dead enemy visible in stage ${id}`);
        }
      }
      const revision=await page.evaluate(()=>window.goonk.sceneRevision);
      await page.evaluate(id=>window.goonk.load(id),id);
      await page.waitForTimeout(450);
      const restart=await page.evaluate(()=>{
        const game=window.goonk,objects=[];
        window.goonkScene.traverse(o=>{if(o.name==='enemy')objects.push(o);});
        return {revision:game.sceneRevision,current:objects.every(o=>game.enemies.includes(o.userData.enemy)),count:objects.length,expected:game.enemies.length};
      });
      assert(restart.revision>revision);assert(restart.current);assert.equal(restart.count,restart.expected);
      await page.screenshot({path:out+`bugfix-stage-${id}-${orientation}.png`});
      result.push({id,orientation,enemyModels:actorState.count,deadHidden:id!==6,restart:true});
    }
  }
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({stageChecks:result,allStagesUnlocked:true,errors}));
} finally {await browser.close();}
