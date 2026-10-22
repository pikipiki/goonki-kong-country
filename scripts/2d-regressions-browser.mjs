// Targeted reproductions: only initial positions/bonus entrances are staged.
// Pickups, bonus traversal, exit, audio recovery and map travel use live gameplay.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const out=fileURLToPath(new URL('../reference/',import.meta.url));
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const report=[],errors=[];
try{
 for(const [name,width,height] of [['portrait',390,844],['landscape',844,390]]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:true});
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.effectSources=[];window.mapDraws=[];
   const start=AudioBufferSourceNode.prototype.start;
   AudioBufferSourceNode.prototype.start=function(...args){
    let peak=0;const channel=this.buffer?.getChannelData(0);if(channel)for(let i=0;i<channel.length;i+=43)peak=Math.max(peak,Math.abs(channel[i]));
    window.effectSources.push({state:this.context.state,peak,time:performance.now()});return start.apply(this,args);
   };
   const draw=CanvasRenderingContext2D.prototype.drawImage;
   CanvasRenderingContext2D.prototype.drawImage=function(...args){
    if(this.canvas.classList.contains('island-map-2d-canvas')&&args[0]?.src?.endsWith('/plush.png'))window.mapDraws.push({x:this.getTransform().e,y:this.getTransform().f,time:performance.now()});
    return draw.apply(this,args);
   };
  });
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:5174/');
  await page.locator('.demo-2d-choices button').first().click();
  await page.waitForFunction(()=>goonkAudio.context?.state==='running'&&goonkAudio.inspect().trackId===0);
  await page.evaluate(()=>{window.played=[];const effect=goonkAudio.effect.bind(goonkAudio);goonkAudio.effect=(name,...rest)=>{window.played.push({name,time:performance.now()});return effect(name,...rest);};});
  await page.waitForTimeout(500);
  const framing=await page.locator('.scene-2d-canvas').evaluate(c=>({width:c.width,height:c.height,rect:c.getBoundingClientRect().toJSON()}));
  assert.equal(framing.width,width<height?192:Math.round(180*width/height));
  await page.screenshot({path:out+`2d-zoom-jungle-${name}.png`});
  await page.evaluate(()=>{const g=goonk,t=g.level.decors.find(d=>d.kind==='token');Object.assign(g.player,{x:t.x-1.3,y:g.floorAt(t.x,t.y+2)??t.y,vx:0,vy:0,grounded:true});});
  await page.keyboard.down('ArrowRight');await page.waitForFunction(()=>goonk.animalTokens.expresso===1);await page.keyboard.up('ArrowRight');
  await page.waitForFunction(()=>goonkAudio.buffers.has(0x60));
  const token=await page.evaluate(()=>({count:goonk.animalTokens.expresso,hidden:goonk.isTokenCollected(goonk.level.decors.find(d=>d.kind==='token')),event:window.played.some(e=>e.name==='animal-token-1'),pcm:window.effectSources.some(s=>s.peak>.001&&s.state==='running')}));
  assert(token.hidden&&token.event&&token.pcm);await page.screenshot({path:out+`2d-token-collected-${name}.png`});
  await page.evaluate(()=>{const g=goonk,room=g.level.bonusRooms[2],w=g.level.breakableWalls[room.wallIndex];g.brokenWalls.add(room.wallIndex);Object.assign(g.player,{x:w.x-1.1,y:w.y,vx:0,vy:0,grounded:true});});
  await page.keyboard.press('ArrowUp');await page.waitForFunction(()=>!!goonk.bonus);
  await page.waitForFunction(()=>goonkAudio.inspect().trackId===16&&goonkAudio.inspect().playing);
  await page.screenshot({path:out+`2d-bonus-${name}.png`});
  await page.keyboard.down('ArrowRight');await page.waitForFunction(()=>!goonk.bonus,null,{timeout:12000});await page.keyboard.up('ArrowRight');
  await page.waitForFunction(()=>goonkAudio.inspect().trackId===0&&goonkAudio.inspect().playing);
  assert.equal(await page.evaluate(()=>goonk.animalTokens.expresso),1);
  // Simulate the suspended effects context reported on mobile. Recover with a
  // genuine keyboard gesture, without calling the audio wake method ourselves.
  await page.evaluate(()=>goonkAudio.context.suspend());await page.keyboard.press('KeyC');
  await page.waitForFunction(()=>goonkAudio.context.state==='running');
  const before=await page.evaluate(()=>effectSources.length);
  await page.evaluate(()=>{const g=goonk,item=g.level.pickups.find((p,i)=>p.kind==='banana'&&!g.collected.has(i));Object.assign(g.player,{x:item.x-.95,y:item.y-.85,vx:0,vy:0,grounded:false});});
  const bananas=await page.evaluate(()=>goonk.bananas);
  await page.keyboard.down('ArrowRight');await page.waitForFunction(b=>goonk.bananas>b,bananas);await page.keyboard.up('ArrowRight');
  await page.waitForFunction(n=>effectSources.slice(n).some(s=>s.peak>.001&&s.state==='running'),before);
  const afterBonus=await page.evaluate(()=>({audio:goonkAudio.inspect(),context:goonkAudio.context.state,actualPickupSound:window.played.some(e=>e.name==='banana')}));
  await page.evaluate(()=>{const g=goonk,z=g.level.finishZone;Object.assign(g.player,{x:z.x-z.w/2-.3,y:g.floorAt(z.x,z.y+1)??z.y,vx:0,vy:0,grounded:true});});
  await page.keyboard.down('ArrowRight');await page.waitForFunction(()=>goonk.phase==='clear');await page.keyboard.up('ArrowRight');
  await page.waitForFunction(()=>goonkAudio.inspect().trackId===26&&goonkAudio.inspect().playing);
  await page.waitForTimeout(500);assert.equal(await page.evaluate(()=>goonk.phase),'clear');
  const clear=await page.evaluate(()=>goonkAudio.inspect());await page.screenshot({path:out+`2d-clear-fanfare-${name}.png`});
  await page.waitForFunction(()=>goonk.phase==='map',null,{timeout:9000});
  await page.waitForFunction(()=>window.played.some(e=>e.name==='map-arrive'));
  assert.equal(await page.locator('.map-stage').nth(1).getAttribute('aria-pressed'),'true');
  const map=await page.evaluate(()=>({track:goonkAudio.inspect(),steps:played.filter(e=>e.name==='map-step').length,arrived:played.some(e=>e.name==='map-arrive'),travel:Math.max(...mapDraws.map(p=>p.x))-Math.min(...mapDraws.map(p=>p.x))}));
  assert(map.steps>=3&&map.arrived&&map.travel>25,JSON.stringify(map));assert.equal(map.track.trackId,12);
  await page.screenshot({path:out+`2d-clear-map-${name}.png`});
  await page.locator('.map-stage').nth(6).click();await page.locator('.map-mode-buttons button').filter({hasText:/^2D$/}).click();await page.locator('.map-enter').click();
  await page.waitForFunction(()=>goonk.levelId===6&&goonk.phase==='playing');
  await page.evaluate(()=>{Object.assign(goonk.player,{x:12.5,y:0,vx:0,vy:0,grounded:true});});
  await page.waitForTimeout(600);await page.screenshot({path:out+`2d-zoom-boss-${name}.png`});
  const boss=await page.evaluate(()=>({camera:goonk.cameraBounds,hp:goonk.player.hp,canvas:document.querySelector('.scene-2d-canvas').width}));
  assert(boss.camera.halfX<(name==='portrait'?7:12));
  report.push({name,framing,token,afterBonus,clear,map,boss});await page.close();
 }
 assert.deepEqual(errors,[]);writeFileSync(out+'2d-regressions-browser.json',JSON.stringify({report,errors,scope:'Targeted staged reproductions; not a complete jungle playthrough'},null,2));
 console.log(JSON.stringify({formats:report.map(r=>r.name),tokenCollected:true,bonusMusicRestored:true,effectsResumeAfterSuspension:true,actualPickupSound:true,clearFanfare:true,automaticFullscreenMap:true,mapTravelSound:true,errors}));
}finally{await browser.close();}
