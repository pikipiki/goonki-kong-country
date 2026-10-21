// Validate actual R3F chunk visibility, including the canyon's large ROM origin.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const out=fileURLToPath(new URL('../reference/',import.meta.url));
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));const checks=[];
try {
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:5174/');
 await page.waitForFunction(()=>!!window.goonkScene);
 for(const [orientation,width,height] of [['landscape',1100,700],['portrait',390,844]]) {
  await page.setViewportSize({width,height});
  for(const [id,name,positions] of [[0,'jungle',[4,58,106,111]],[1,'canyon',[0,20,145,320]],[2,'mine-cart',[13,30,90,145]]]) {
   for(const x of positions) {
    await page.evaluate(({id,x})=>{const g=window.goonk;g.start(id,true);g.enemies.forEach(e=>e.alive=false);g.player.x=x;g.player.y=g.supportAt(x,6,0)??4;g.player.invincible=100;}, {id,x});
    await page.waitForFunction(name=>{if(!window.goonkScene)return false;let count=0;window.goonkScene.traverse(o=>{if(o.name===`${name}-ground-chunk`)count++;});return count>0;},name);
    await page.waitForTimeout(280);
    const state=await page.evaluate(name=>{
     const g=window.goonk,near=[];
     window.goonkScene.traverse(o=>{if(o.name!==`${name}-ground-chunk`)return;const b=o.children[0].geometry.boundingBox??(o.children[0].geometry.computeBoundingBox(),o.children[0].geometry.boundingBox);if(b&&b.max.x>=g.player.x-12&&b.min.x<=g.player.x+12)near.push({visible:o.visible,min:b.min.x,max:b.max.x});});
     return {id:g.levelId,x:g.player.x,near};
    },name);
    assert(state.near.length>0,JSON.stringify(state));assert(state.near.every(c=>c.visible),JSON.stringify(state));checks.push({orientation,...state});
    if(id===0)await page.screenshot({path:out+`ground-fixed-jungle-${x}-${orientation}.png`});
    else if(x===positions[1])await page.screenshot({path:out+`ground-fixed-${name}-${orientation}.png`});
   }
  }
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({checks,errors}));
} finally {await browser.close();}
