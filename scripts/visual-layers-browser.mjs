// Visual/collision-layer regression checks, with controlled camera positions.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const out=fileURLToPath(new URL('../reference/',import.meta.url));
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const page=await browser.newPage({viewport:{width:1100,height:700}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try {
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:5174/');
 await page.waitForFunction(()=>!!window.goonk);
 const checks=[];
 for(const [name,id,x,y] of [
  ['jungle-entry',0,4.875,0],['jungle-slope',0,58,1.5],['jungle-lower',0,106,-.5],
  ['canyon',1,20,2],['cart',2,30,2],['coral',3,20,1.8],
  ['snow',4,30,0],['temple',5,40,0],['boss',6,27,0],
 ]) {
  await page.evaluate(({id,x,y})=>{
   const g=window.goonk;g.start(id,id<4);g.player.x=x;g.player.y=y;g.player.invincible=100;
  },{id,x,y});
  await page.waitForTimeout(500);
  const state=await page.evaluate(()=>{
   const backgrounds=[],walls=[],water=[],carts=[],hidden=[];
   window.goonkScene.traverse(o=>{if(o.name==='background-decor')backgrounds.push(o);if(o.name==='breakable-wall')walls.push(o);if(o.name==='background-water')water.push(o);if(o.name==='mine-cart')carts.push(o);if(o.name==='hidden-cache')hidden.push(o);});
   let maxZ=-Infinity;
   for(const root of backgrounds) root.traverse(o=>{
    if(!o.geometry)return; o.geometry.computeBoundingBox();
    if(o.isInstancedMesh) for(let i=0;i<o.count;i++) {
     const matrix=o.matrixWorld.clone();o.getMatrixAt(i,matrix);matrix.premultiply(o.matrixWorld);
     maxZ=Math.max(maxZ,o.geometry.boundingBox.clone().applyMatrix4(matrix).max.z);
    } else maxZ=Math.max(maxZ,o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld).max.z);
   });
   return {id:window.goonk.levelId,biome:window.goonk.level.biome,maxZ,water:water.length,cart:carts.some(o=>o.visible),cachesHidden:hidden.every(o=>!o.visible),walls:walls.length,expectedWalls:window.goonk.level.breakableWalls?.length??0};
  });
  assert(state.maxZ < -2,JSON.stringify(state));
  assert.equal(state.water,['ship','lagoon'].includes(state.biome)?1:0);
  assert.equal(state.walls,state.expectedWalls);
  assert.equal(state.cart,id===2);assert(state.cachesHidden);
  await page.screenshot({path:out+`decor-${name}-landscape.png`});
  if(state.walls) {
   await page.evaluate(()=>window.goonk.level.breakableWalls.forEach((_,i)=>window.goonk.brokenWalls.add(i)));
   await page.waitForTimeout(80);
   assert(await page.evaluate(()=>{let hidden=true;window.goonkScene.traverse(o=>{if(o.name==='breakable-wall'&&o.visible)hidden=false;});return hidden;}));
  }
  checks.push(state);
 }
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>window.goonk.start(0,true));await page.waitForTimeout(500);
 await page.screenshot({path:out+'decor-jungle-portrait.png'});
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({checks,portrait:true,errors}));
} finally {await browser.close();}
