// Targeted reproductions: initial positions/phase staged; real touch inputs,
// damage enabled. Full input-only battle is separately boss-battle-browser.mjs.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const out=fileURLToPath(new URL('../reference/',import.meta.url)),report=[],errors=[];
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try{
 for(const [format,width,height] of [['portrait',390,844],['landscape',844,390]])for(const mode of ['2d','3d']){
  const page=await browser.newPage({viewport:{width,height},hasTouch:true});page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.playedSounds=[];const start=AudioBufferSourceNode.prototype.start;
   AudioBufferSourceNode.prototype.start=function(...a){const audio=window.goonkAudio;let id;for(const [key,buffer] of audio?.buffers??[])if(buffer===this.buffer)id=key;
    let peak=0;const samples=this.buffer?.getChannelData(0);if(samples)for(let i=0;i<samples.length;i++)peak=Math.max(peak,Math.abs(samples[i]));
    window.playedSounds.push({id,peak,state:this.context.state,time:window.goonk?.time});return start.apply(this,a);
   };
   window.barrelDraws=[];const draw=CanvasRenderingContext2D.prototype.drawImage;
   CanvasRenderingContext2D.prototype.drawImage=function(...a){if(a[0]?.src?.endsWith('/rom2d/sprites.png')&&a.length===9){const f=window.barrelFrames?.find(f=>f.x===a[1]&&f.y===a[2]&&f.w===a[3]&&f.h===a[4]);if(f){window.barrelDraws.push({kind:f.kind,ratio:a[8]/f.h,carry:window.goonk?.player.carry,thrown:window.goonk?.thrown.length});if(window.barrelDraws.length>500)window.barrelDraws.shift();}}return draw.apply(this,a);};
  });
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:5174/');
  if(mode==='2d')await page.locator('.demo-2d-choices button').nth(1).click();
  else{await page.getByRole('button',{name:'Explore the island',exact:true}).click();await page.locator('.map-stage').nth(6).click();await page.locator('.map-enter').click();}
  await page.waitForFunction(()=>window.goonk?.phase==='playing'&&window.goonk.levelId===6);await page.waitForTimeout(500);
  const cdp=await page.context().newCDPSession(page),touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([id,x,y])=>({id,x,y}))});
  const jumps=[];
  for(const active of [0,1]){
   await page.evaluate(a=>{goonk.start(6,true);window.playedSounds=[];Object.assign(goonk.player,{active:a,x:13,y:0,vx:0,vy:0,grounded:true});},active);
   await page.waitForFunction(()=>goonk.bossBattle.phase==='catch');
   const rect=async s=>{const r=await page.locator(s).boundingBox();return[r.x+r.width/2,r.y+r.height/2];};
   const dir=await rect('.direction-button.right'),jump=await rect('.jump-button');
   await touch('touchStart',[[1,...dir],[2,...jump]]);await page.waitForTimeout(35);await touch('touchEnd',[[2,...jump]]);
   await page.waitForFunction(()=>goonk.player.x>=goonk.enemies[0].x-.3||goonk.enemies[0].hp<10,null,{timeout:3000});await touch('touchEnd',[]);
   await page.waitForFunction(()=>goonk.enemies[0].hp===9,null,{timeout:3000});
   await page.waitForFunction(()=>playedSounds.some(s=>s.id===83&&s.peak>0&&s.state==='running'),null,{timeout:3000});
   const result=await page.evaluate(()=>({hp:goonk.player.hp,lives:goonk.lives,bossHP:goonk.enemies[0].hp,sounds:playedSounds.filter(s=>s.id===83)}));
   assert.equal(result.hp,2);assert.equal(result.lives,5);assert.equal(result.sounds.length,1);jumps.push({active,...result});
   await page.screenshot({path:out+`boss-feedback-${mode}-${format}-${active}.png`});
  }
  const entry={format,mode,jumps};
  if(mode==='2d'){
   await page.evaluate(async()=>{const m=await(await fetch('/rom2d/manifest.json')).json();window.barrelFrames=['barrel_idle','barrel_roll','dk_barrel','checkpoint_barrel'].flatMap(kind=>m.groups[kind].map(i=>({...m.frames[i],kind})));goonk.start(6,true);Object.assign(goonk.player,{x:10,y:0,vx:0,vy:0,grounded:true});window.barrelDraws=[];});
   await page.waitForTimeout(250);const ground=await page.evaluate(()=>barrelDraws.filter(b=>b.kind==='barrel_idle').at(-1));assert(ground);
   await page.locator('.action-button').tap();await page.waitForFunction(()=>goonk.player.carry===1);await page.waitForTimeout(150);
   const carried=await page.evaluate(()=>barrelDraws.filter(b=>b.kind==='barrel_idle'&&b.carry===1).at(-1));assert(carried);assert(Math.abs(carried.ratio-ground.ratio)<.001);
   await page.screenshot({path:out+`boss-barrel-carried-${format}.png`});
   await page.locator('.jump-button').tap();await page.waitForFunction(()=>goonk.player.y>.5);await page.waitForFunction(()=>goonk.player.grounded);assert.equal(await page.evaluate(()=>goonk.player.carry),1);
   await page.locator('.action-button').tap();await page.waitForFunction(()=>goonk.thrown.length>0);await page.waitForTimeout(90);
   const thrown=await page.evaluate(()=>barrelDraws.filter(b=>b.kind==='barrel_roll'&&b.thrown>0).at(-1));assert(thrown);assert(Math.abs(thrown.ratio-ground.ratio)<.001);
   await page.screenshot({path:out+`boss-barrel-thrown-${format}.png`});
   await page.waitForFunction(()=>goonk.enemies[0].hp===9,null,{timeout:2500});
   const barrelBossHP=await page.evaluate(()=>goonk.enemies[0].hp);
   const limits=[];
   for(const [side,x,key,expected]of [['left',1.4,'ArrowLeft',.75],['right',20.6,'ArrowRight',21.25]]){
    await page.evaluate(x=>{goonk.start(6,true);Object.assign(goonk.player,{x,y:0,vx:0,vy:0,grounded:true});},x);
    await page.keyboard.down(key);await page.waitForTimeout(600);await page.keyboard.up(key);await page.waitForTimeout(150);
    const state=await page.evaluate(()=>({x:goonk.player.x,y:goonk.player.y,vx:goonk.player.vx,hp:goonk.player.hp}));assert(Math.abs(state.x-expected)<.001);assert.equal(state.vx,0);assert.equal(state.hp,2);limits.push({side,...state});
    await page.screenshot({path:out+`boss-arena-${side}-${format}.png`});
   }
   entry.objects={ground,carried,thrown,barrelBossHP,limits};
  }else{
   await page.evaluate(()=>{
    goonk.start(6,true);Object.assign(goonk.bossBattle,{phase:'rain',phaseTime:0,rainCount:1,spawned:0,ballClock:0});window.ballFrames=[];
    const capture=()=>{const i=goonk.bossProjectiles.findIndex(p=>p.kind==='cannonball'),p=goonk.bossProjectiles[i],node=goonkScene.getObjectByName('boss-projectiles')?.children[i];if(p&&node)ballFrames.push({y:p.y,warning:p.warning,impact:p.impact??0,bounces:p.bounces??0,renderY:node.position.y,scaleX:node.children[1].scale.x,scaleY:node.children[1].scale.y});if(goonk.bossBattle.phase==='rain')requestAnimationFrame(capture);};requestAnimationFrame(capture);
   });
   await page.waitForFunction(()=>ballFrames.some(f=>f.impact>0));await page.screenshot({path:out+`boss-ball-impact-${format}.png`});
   await page.waitForFunction(()=>goonk.bossBattle.phase!=='rain');
   const frames=await page.evaluate(()=>ballFrames),fall=frames.filter(f=>f.warning===0&&f.bounces===0),impact=frames.find(f=>f.impact>0&&f.scaleX>f.scaleY),bounce=frames.filter(f=>f.bounces===1&&f.impact===0);
   assert(fall.some((f,i)=>i>0&&f.y===fall[i-1].y));assert(fall.some((f,i)=>i>0&&f.y<fall[i-1].y));assert(impact);assert(bounce.some(f=>f.y>1));
   // Render callbacks can run one frame before this RAF probe; allow one pose's displacement.
   assert(frames.filter(f=>f.warning===0).every(f=>Math.abs(f.y-f.renderY)<.7));
   entry.balls={poseCount:frames.length,heldFallingPoses:true,impact,reboundPeak:Math.max(...bounce.map(f=>f.y))};
  }
  report.push(entry);console.log(JSON.stringify(entry));await page.close();
 }
 assert.deepEqual(errors,[]);writeFileSync(out+'boss-feedback-browser.json',JSON.stringify({report,errors,stagedReproductions:true,damageEnabled:true},null,2));
}finally{await browser.close();}
