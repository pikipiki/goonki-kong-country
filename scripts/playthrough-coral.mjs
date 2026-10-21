// Real keyboard playthrough: no writes to game state, no disabled enemies, no teleports.
import {createServer} from 'vite';
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const output=fileURLToPath(new URL('../reference/',import.meta.url));
const vite=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'});
const {Game,emptyInput}=await vite.ssrLoadModule('/src/game/engine.ts');
const model=new Game();model.start(3,true);
const {coralBodyBlocked,resolveCoralMotion,SWIM_BODY}=await vite.ssrLoadModule('/src/game/terrainSolids.ts');
const {ENGUARDE_SWIM_BODY}=await vite.ssrLoadModule('/src/game/animals.ts');
const {CORAL_WORLD_WIDTH,CORAL_WATER_FLOOR_Y,CORAL_WATER_SURFACE_Y}=await vite.ssrLoadModule('/src/game/marineScale.ts');
await vite.close();
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const page=await browser.newPage({viewport:{width:1100,height:700}}),log=[],events=[],errors=[];
page.on('pageerror',e=>errors.push(e.message));
const held=new Set();
async function keys(next) {
 for(const key of [...held])if(!next.includes(key)){await page.keyboard.up(key);held.delete(key);}
 for(const key of next)if(!held.has(key)){await page.keyboard.down(key);held.add(key);}
}
async function state(){return page.evaluate(()=>{const g=window.goonk;return {phase:g.phase,time:g.time,lives:g.lives,bananas:g.bananas,player:{...g.player},animals:g.animals.map(a=>({...a})),enemies:g.enemies.filter(e=>e.alive).map(e=>({...e})),finish:g.level.finishZone,toast:g.toast,collected:[...g.collected],usedBarrels:[...g.usedBarrels],checkpoint:{...g.checkpoint}};});}
function findRoute(s,target,body,avoid=true) {
 const grid=.5,sx=Math.round(s.player.x*2)/2,sy=Math.round(s.player.y*2)/2;
 const start={x:sx,y:sy,parent:-1,cost:0},nodes=[start],seen=new Map([[`${sx},${sy}`,0]]),queue=[0];let goal=-1;
 // A* with a soft cost for enemies' current swim volume; hazards stay active.
 while(queue.length) {
  let best=0;for(let k=1;k<queue.length;k++)if(nodes[queue[k]].score<nodes[queue[best]].score)best=k;
  const index=queue.splice(best,1)[0],n=nodes[index];
  if(Math.abs(n.x-target.x)<target.w/2-.2&&n.y>=target.y+.1&&n.y<=target.y+target.h-.1){goal=index;break;}
  for(const [dx,dy] of [[grid,0],[-grid,0],[0,grid],[0,-grid]]){
   const x=n.x+dx,y=n.y+dy,key=`${x},${y}`;
   if(x<.5||x>CORAL_WORLD_WIDTH-.5||y<CORAL_WATER_FLOOR_Y+.1||y>CORAL_WATER_SURFACE_Y-.5||coralBodyBlocked(x,y,body))continue;
   const motion=resolveCoralMotion(n.x,n.y,x,y,body);if(Math.abs(motion.x-x)>.001||Math.abs(motion.y-y)>.001)continue;
   let risk=0;
   if(avoid) for(const e of s.enemies){const d=Math.hypot((x-e.x)*.9,y+.4-e.y-.6);if(d<3)risk+=(3-d)*6;}
   const cost=n.cost+grid+risk,old=seen.get(key);if(old!==undefined&&nodes[old].cost<=cost)continue;
   const node={x,y,parent:index,cost,score:cost+Math.abs(x-target.x)+Math.abs(y-target.y)};
   const i=nodes.push(node)-1;seen.set(key,i);queue.push(i);
  }
 }
 if(goal<0)return null;
 const route=[];for(let i=goal;i>=0;i=nodes[i].parent)route.push({x:nodes[i].x,y:nodes[i].y});route.reverse();
 return route;
}
function steering(s,target) {
 const choices=[[],['ArrowLeft'],['ArrowRight'],['ArrowUp'],['ArrowDown'],['ArrowLeft','ArrowUp'],['ArrowRight','ArrowUp'],['ArrowLeft','ArrowDown'],['ArrowRight','ArrowDown']];
 let winner=[],best=Infinity;
 for(const choice of choices) {
  const g=Object.assign(Object.create(Game.prototype),model);
  Object.assign(g,{player:{...s.player},enemies:s.enemies.map(e=>({...e})),animals:s.animals.map(a=>({...a})),time:s.time,lives:s.lives,phase:'playing',particles:[],thrown:[],enemyShots:[],trail:[],collected:new Set(s.collected),usedBarrels:new Set(s.usedBarrels),letters:new Set(),collectedBonus:new Set(),revealedCaches:new Set(),collectedCaches:new Set(),brokenWalls:new Set(),onEvent:()=>{},onSave:()=>{}});
  const input=emptyInput();for(const k of choice)input.held.add({ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'}[k]);
  for(let i=0;i<10;i++)g.update(input);
  const p=g.player,dx=p.x-target.x,dy=p.y-target.y;
  let cost=Math.hypot(dx,dy)*8;
  cost+=(s.player.hp-p.hp)*100+(s.lives-g.lives)*1000;
  if(s.player.mount>=0&&p.mount<0)cost+=100;
  if(p.mount<0)for(const e of g.enemies.filter(e=>e.alive)) {
   const d=Math.hypot((p.x-e.x)*.9,p.y+.45-e.y-.6);if(d<1.6)cost+=(1.6-d)*20;
  }
  cost+=(choice.length?0:.01);
  if(cost<best){best=cost;winner=choice;}
 }
 return winner;
}
function compress(route) {
 if(!route||route.length<3)return route||[];
 const out=[];
 for(let i=1;i<route.length-1;i++)if(route[i].x-route[i-1].x!==route[i+1].x-route[i].x || route[i].y-route[i-1].y!==route[i+1].y-route[i].y)out.push(route[i]);
 out.push(route.at(-1));return out;
}
async function plan(s,target,body) {
 await keys([]);await page.keyboard.press('KeyP');await page.waitForFunction(()=>window.goonk.phase==='paused');
 const stopped=await state();const path=compress(findRoute(stopped,target,body));
 await page.keyboard.press('KeyP');await page.waitForFunction(()=>window.goonk.phase==='playing');
 return path;
}
let previousLives=5,deaths=0,lastSnapshot=0,route=[],target=null,targetKind='exit',stuck=0,lastXY=null;
try{
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:5174/');await page.waitForFunction(()=>!!window.goonk);
 await page.getByRole('button',{name:/Explorer l’île|Explore the island/}).click();await page.locator('.map-stage').nth(3).click();await page.locator('.map-enter').click();
 await page.waitForFunction(()=>window.goonk.phase==='playing'&&window.goonk.levelId===3);
 const first=await state();log.push({type:'start',...first});previousLives=first.lives;
 await fs.writeFile(output+'coral-playthrough-start.json',JSON.stringify(first,null,2));
 for(let tick=0;tick<1800;tick++){
  const s=await state(),p=s.player;
  if(s.lives<previousLives){deaths+=previousLives-s.lives;events.push({type:'death',tick,...s});}
  previousLives=s.lives;
  if(tick%10===0) {log.push({tick,time:s.time,lives:s.lives,hp:p.hp,x:p.x,y:p.y,mount:p.mount,enemyCount:s.enemies.length,keys:[...held]});console.log(JSON.stringify(log.at(-1)));}
  if(s.phase==='clear'){await keys([]);await page.screenshot({path:output+'coral-playthrough-complete.png'});log.push({type:'complete',deaths,...s});break;}
  if(s.phase!=='playing'||deaths){await keys([]);await page.screenshot({path:output+'coral-playthrough-blocked.png'});log.push({type:'blocked',deaths,...s});break;}
  const body=p.mount>=0?ENGUARDE_SWIM_BODY:SWIM_BODY;
  if(!target || (targetKind==='animal' && p.mount>=0)) {
   target=s.finish;targetKind='exit';route=[];
   if(p.mount<0) {
    let best=null;
    for(const animal of s.animals.filter(a=>a.state==='crate'||a.state==='idle')) {
     const zone={x:animal.x,y:animal.y-.3,w:1.7,h:1.3},candidate=findRoute(s,zone,body);
     if(candidate&&(!best||candidate.length<best.route.length))best={zone,route:candidate};
    }
    if(best){target=best.zone;route=compress(best.route);targetKind='animal';}
   }
  }
  if(!route.length)route=await plan(s,target,body);
  while(route.length&&Math.hypot(p.x-route[0].x,p.y-route[0].y)<.22)route.shift();
  const animal=s.animals.find(a=>a.state==='crate'&&Math.abs(a.x-p.x)<1.6&&Math.abs(a.y-p.y)<1.7);
  if(animal&&tick%4===0){await page.keyboard.press('KeyX');events.push({type:'crate-action',x:p.x,y:p.y});}
  const next=route[0];
  if(!next){await keys([]);if(targetKind==='animal'&&p.mount<0){target=null;}await page.waitForTimeout(80);continue;}
  const pressed=steering(s,next);
  if(p.mount>=0 && s.enemies.some(e=>Math.abs(e.y-p.y)<1.5&&Math.abs(e.x-p.x)<4) && tick%3===0)await page.keyboard.press('Space');
  if(lastXY&&Math.hypot(p.x-lastXY.x,p.y-lastXY.y)<.015)stuck++;else stuck=0;
  if(stuck>30){events.push({type:'stuck',tick,x:p.x,y:p.y,next,toast:s.toast});route=[];stuck=0;await page.screenshot({path:output+`coral-playthrough-stuck-${tick}.png`});}
  lastXY={x:p.x,y:p.y};await keys(pressed);await page.waitForTimeout(80);
  if(s.time-lastSnapshot>12){lastSnapshot=s.time;await page.screenshot({path:output+`coral-playthrough-${Math.floor(s.time)}s.png`});}
 }
 await keys([]);const final=await state();
 await fs.writeFile(output+'coral-playthrough.json',JSON.stringify({inputOnly:true,enemyDamageEnabled:true,deaths,final,log,events,errors},null,2));
 if(final.phase!=='clear'||deaths)process.exitCode=1;
 console.log(JSON.stringify({done:true,phase:final.phase,deaths,lives:final.lives,time:final.time,player:final.player,errors}));
}finally{await browser.close();}
