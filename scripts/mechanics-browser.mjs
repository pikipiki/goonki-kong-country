import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const out=fileURLToPath(new URL('../reference/',import.meta.url));
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const results=[],errors=[];
try {
 for(const [orientation,width,height] of [['portrait',390,844],['landscape',844,390]]) {
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:5174/');await page.waitForFunction(()=>!!window.goonk);
  for(const kind of ['rambi','enguarde']) {
   await page.evaluate(kind=>{const g=window.goonk;g.start(kind==='rambi'?0:3,false);g.enemies=[];g.animals[0].state='ridden';Object.assign(g.player,{mount:0,x:kind==='rambi'?12:20,y:kind==='rambi'?0:2,invincible:0});},kind);
   await page.getByRole('button',{name:'Charge',exact:true}).waitFor();
   const button=await page.getByRole('button',{name:'Charge',exact:true}).boundingBox();
   await page.mouse.move(button.x+button.width/2,button.y+button.height/2);await page.mouse.down();
   await page.waitForFunction(()=>window.goonk.player.mountCharge>=.65);
   assert(await page.getByRole('progressbar',{name:'Puissance de charge'}).isVisible());
   await page.mouse.up();await page.waitForFunction(()=>window.goonk.player.mountCharged);
   const state=await page.evaluate(()=>({vx:window.goonk.player.vx,charge:window.goonk.player.mountCharge,attack:window.goonk.player.mountAttack}));
   assert(Math.abs(state.vx)>12);results.push({orientation,kind,heldRelease:true,...state});
   await page.screenshot({path:out+`mechanics-${kind}-${orientation}.png`});
  }
  // Click-only charge: one click prepares, the next releases. No timed short pulse.
  await page.getByRole('button',{name:'Mode tactile'}).click();
  await page.getByRole('button',{name:'Mode clic'}).waitFor();
  await page.getByRole('button',{name:'Charge',exact:true}).click();
  await page.waitForFunction(()=>window.goonk.player.mountCharge>=.65);
  assert.equal(await page.getByRole('button',{name:'Relâcher',exact:true}).getAttribute('aria-pressed'),'true');
  await page.getByRole('button',{name:'Relâcher',exact:true}).click();
  await page.waitForFunction(()=>window.goonk.player.mountCharged);results.push({orientation,clickCharge:true});
  // Imported reef: actual mount event, then vertical steering from the screen.
  await page.evaluate(()=>{const g=window.goonk;g.start(3,true);g.enemies=[];g.animals[0].state='idle';Object.assign(g.player,{x:g.animals[0].x,y:g.animals[0].y,invincible:0});});
  await page.waitForFunction(()=>window.goonk.mount?.kind==='enguarde');
  const y=await page.evaluate(()=>window.goonk.player.y);
  await page.getByRole('button',{name:'Nager vers le haut',exact:true}).click();
  await page.waitForFunction(y=>window.goonk.player.y>y+.8,y);
  await page.getByRole('button',{name:'Nager vers le haut',exact:true}).click();
  results.push({orientation,enguardeRises:true});
  await page.evaluate(()=>{const g=window.goonk;g.start(4);g.enemies=[];g.animals[0].state='ridden';Object.assign(g.player,{mount:0,x:20,y:5,vy:-8,grounded:false});});
  await page.getByRole('button',{name:'Planer',exact:true}).click();
  const flutterStart=await page.evaluate(()=>window.goonk.player.y);
  await page.waitForTimeout(700);
  const flutter=await page.evaluate(()=>({y:window.goonk.player.y,vy:window.goonk.player.vy,wings:(()=>{const a=[];window.goonkScene.traverse(o=>{if(o.name==='animal-wing')a.push(o.rotation.x);});return a;})()}));
  assert(flutter.y>flutterStart-.6,JSON.stringify({flutter,flutterStart}));assert(flutter.vy>=-.66);assert(flutter.wings.some(x=>Math.abs(x)>.3));
  await page.screenshot({path:out+`mechanics-expresso-${orientation}.png`});
  await page.getByRole('button',{name:'Planer',exact:true}).click();
  await page.waitForFunction(()=>window.goonk.player.vy< -2);results.push({orientation,expressoFlutters:true});
  // Move into an already-open real jungle wall; entering cannot require passing through source terrain.
  await page.evaluate(()=>{const g=window.goonk;g.start(0,true);g.enemies=[];const w=g.level.breakableWalls[2];g.brokenWalls.add(2);Object.assign(g.player,{x:w.x-1.15,y:w.y,grounded:true,invincible:0});});
  await page.getByRole('button',{name:'Aller à droite',exact:true}).click();
  await page.waitForFunction(()=>!!window.goonk.bonus,null,{timeout:4000}).catch(async error=>{console.log(await page.evaluate(()=>({phase:window.goonk.phase,player:window.goonk.player,broken:[...window.goonk.brokenWalls],bonus:window.goonk.bonus})));throw error;});
  await page.getByRole('button',{name:'Arrêter le déplacement'}).click();
  const bonus=await page.evaluate(()=>({name:window.goonk.level.name,x:window.goonk.player.x,terrain:window.goonk.level.originalTerrain}));
  assert.equal(bonus.terrain,undefined);assert(bonus.x<4);results.push({orientation,bonusEntered:true});
  await page.screenshot({path:out+`mechanics-bonus-${orientation}.png`});
  await page.getByRole('button',{name:'Aller à droite',exact:true}).click();
  await page.waitForFunction(()=>!window.goonk.bonus,{},{timeout:15000});
  await page.getByRole('button',{name:'Arrêter le déplacement'}).click();
  assert.equal(await page.evaluate(()=>window.goonk.collectedBonus.size),3);results.push({orientation,bonusReturn:true});
  await context.close();
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({results,errors}));
}finally{await browser.close();}
