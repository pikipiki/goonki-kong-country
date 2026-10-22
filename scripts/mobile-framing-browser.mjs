// Targeted visual/touch checks with staged approach positions, damage active.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {writeFileSync} from 'node:fs';
const out=fileURLToPath(new URL('../reference/',import.meta.url)),report=[],errors=[];
const b=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const base=process.env.GAME_URL||'http://127.0.0.1:5174/';
try{
 for(const [name,width,height] of [['portrait',390,844],['small',320,640],['landscape',844,390]]){
  const p=await b.newPage({viewport:{width,height},hasTouch:true});p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{const draw=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(...a){if(a[0]?.src?.endsWith('/map-kongo.png'))window.lastMap={x:a[5],y:a[6],w:a[7],h:a[8],cw:this.canvas.width,ch:this.canvas.height};return draw.apply(this,a);};});
  await p.goto(base);await p.getByRole('button',{name:'Start the adventure',exact:true}).click();await p.waitForTimeout(700);
  const camera3D=await p.evaluate(()=>goonk.cameraBounds);
  if(width<height)assert(camera3D.halfX<5.1);
  await p.screenshot({path:out+`framing-3d-${name}.png`});
  await p.locator('.brand').click();await p.locator('.demo-2d-choices button').first().click();
  // Render the source rescue barrel without collecting it on the way in.
  await p.evaluate(()=>{const g=goonk,barrel=g.level.barrels.find(b=>b.kind==='rescue');Object.assign(g.player,{x:barrel.x-2,y:g.floorAt(barrel.x-2,barrel.y+2)??barrel.y,vx:0,vy:0,grounded:true});});
  await p.waitForTimeout(700);await p.screenshot({path:out+`framing-dk-${name}.png`});
  await p.getByRole('button',{name:'Explore the island',exact:true}).click();
  await p.waitForFunction(()=>!!window.lastMap);await p.waitForTimeout(250);
  const map=await p.evaluate(()=>window.lastMap);
  assert(map.x<=.01&&map.y<=.01&&map.x+map.w>=map.cw-.01&&map.y+map.h>=map.ch-.01,JSON.stringify(map));
  await p.screenshot({path:out+`framing-map-${name}.png`});
  const cdp=await p.context().newCDPSession(p),touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([id,x,y])=>({id,x,y}))});
  const x=width/2,y=height*.43;
  await touch('touchStart',[[1,x,y]]);await touch('touchMove',[[1,x-(width<height?65:0),y-(width<height?0:65)]]);await touch('touchEnd',[]);await p.waitForTimeout(100);
  const moved=await p.evaluate(()=>window.lastMap);
  assert(Math.abs(map.x-moved.x)+Math.abs(map.y-moved.y)>20,'Map did not pan');
  await p.locator('.map-stage').nth(6).click();await p.locator('.map-mode-buttons button').filter({hasText:/^2D$/}).click();await p.locator('.map-enter').click();await p.waitForFunction(()=>goonk.levelId===6&&goonk.phase==='playing');
  const buttons=await p.locator('.boss-controls .direction-button,.boss-controls .jump-button,.boss-controls .action-button,.boss-controls .swap-button').evaluateAll(bs=>bs.map(b=>{const r=b.getBoundingClientRect();return {name:b.getAttribute('aria-label'),cls:b.className,x:r.x,y:r.y,w:r.width,h:r.height};}));
  for(const r of buttons){assert(r.x>=0&&r.x+r.w<=width+.01,JSON.stringify(r));if(r.cls.includes('direction-button')){assert(r.w>=74&&r.h>=96,JSON.stringify(r));}}
  for(let i=0;i<buttons.length;i++)for(const q of buttons.slice(i+1)){const a=buttons[i];assert(a.x+a.w<=q.x||q.x+q.w<=a.x||a.y+a.h<=q.y||q.y+q.h<=a.y,JSON.stringify({overlap:[a,q]}));}
  const jumps=[];
  for(const active of [0,1]){
   // Setup only: ordinary deck position and chosen plush. The actual crown
   // throw, finger inputs, ascent and head landing are normal game updates.
   if(active)await p.evaluate(()=>goonk.start(6,true));
   await p.evaluate(a=>Object.assign(goonk.player,{active:a,x:13,y:0,vx:0,vy:0,grounded:true}),active);
   await p.waitForFunction(()=>goonk.bossBattle.phase==='catch');
   await p.screenshot({path:out+`framing-boss-${name}-${active}.png`});
   const dir=buttons.find(b=>b.name==='Move right'),jump=buttons.find(b=>b.name==='Jump');
   await touch('touchStart',[[1,dir.x+dir.w/2,dir.y+dir.h/2],[2,jump.x+jump.w/2,jump.y+jump.h/2]]);
   await p.waitForTimeout(30);await touch('touchEnd',[[2,jump.x+jump.w/2,jump.y+jump.h/2]]);
   await p.waitForFunction(()=>goonk.player.y>3||goonk.enemies[0].hp<10);
   await p.screenshot({path:out+`framing-jump-${name}-${active}.png`});
   await p.waitForFunction(()=>goonk.player.x>=goonk.enemies[0].x-.3||goonk.enemies[0].hp<10,null,{timeout:2500}).catch(async e=>{console.log(await p.evaluate(()=>({player:goonk.player,boss:goonk.enemies[0],phase:goonk.bossBattle,buttons:[...document.querySelectorAll('.controller-deck button')].map(b=>({text:b.title,cls:b.className}))})));await p.screenshot({path:out+'framing-debug.png'});throw e;});
   await touch('touchEnd',[]);
   await p.waitForFunction(()=>goonk.enemies[0].hp===9,null,{timeout:2500});
   const result=await p.evaluate(()=>({hp:goonk.player.hp,lives:goonk.lives,boss:goonk.enemies[0].hp}));assert.equal(result.hp,2);assert.equal(result.lives,5);jumps.push({active,...result});
  }
  report.push({name,camera3D,map,pan:{dx:moved.x-map.x,dy:moved.y-map.y},buttons,jumps});await p.close();
 }
 assert.deepEqual(errors,[]);writeFileSync(out+'mobile-framing-browser.json',JSON.stringify({report,errors},null,2));console.log(JSON.stringify({formats:report.map(r=>r.name),mapCoversScreen:true,mapPans:true,largeDirections:true,bothPlushTouchStomps:true,errors}));
}finally{await b.close();}
