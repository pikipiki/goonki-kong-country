// Targeted cart bird -> Zinger landing regressions; setup is not a full playthrough.
import {chromium} from 'playwright';
import {fileURLToPath} from 'node:url';
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const out=fileURLToPath(new URL('../reference/',import.meta.url));
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}),results=[],errors=[];
try{
 for(const [orientation,width,height] of [['portrait',390,844],['landscape',844,390]]){
  const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:5174/');await page.waitForFunction(()=>!!window.goonk&&!!window.goonkScene);
  for(const birdX of [106.28125,404.34375])for(const active of [0,1]){
   await page.evaluate(({birdX,active})=>{const g=window.goonk;g.start(2,true);const b=g.enemies.find(e=>e.pattern==='necky'&&e.x===birdX);Object.assign(g.player,{active,x:b.x-.6,y:b.y+.78,vy:-8,vx:8.5,grounded:false,invincible:0});}, {birdX,active});
   // Reproduction setup ends here. Let the actual runtime rebound and land;
   // no invincibility, enemy removal or further game-state writes.
   const goal=birdX<200?124:430;
   await page.waitForFunction(goal=>window.goonk.player.x>=goal||window.goonk.lives<5||window.goonk.player.hp<2,goal,{timeout:8000});
   const result=await page.evaluate(()=>({x:window.goonk.player.x,y:window.goonk.player.y,hp:window.goonk.player.hp,lives:window.goonk.lives,grounded:window.goonk.player.grounded,enemies:window.goonk.enemies.length,beesAlive:window.goonk.enemies.filter(e=>e.alive&&e.kind==='bee'&&e.pattern!=='necky').length}));
   assert(result.x>=goal,JSON.stringify(result));assert.equal(result.hp,2);assert.equal(result.lives,5);assert(result.grounded);assert.equal(result.enemies,30);assert.equal(result.beesAlive,14);
   results.push({orientation,birdX,active,...result});
   if(active===0)await page.screenshot({path:out+`mine-bird-landing-${Math.floor(birdX)}-${orientation}.png`});
  }
  await page.close();
 }
 assert.deepEqual(errors,[]);writeFileSync(out+'mine-bird-browser.json',JSON.stringify({setup:'Targeted descending-contact setup before each bird; normal runtime thereafter, all enemies and damage active',results,errors},null,2));console.log(JSON.stringify({results,errors}));
}finally{await browser.close();}
