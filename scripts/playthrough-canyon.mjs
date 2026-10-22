// Actual browser playthrough: UI and keyboard mutate the live game. The debug
// game is read only; offline Game copies score candidate input sequences.
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { writeFileSync,readFileSync } from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=root+'reference/';
const vite=await createServer({root:process.env.GAME_ROOT||root,server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'silent'});
const {Game,emptyInput}=await vite.ssrLoadModule('/src/game/engine.ts');
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const page=await browser.newPage({viewport:{width:1100,height:700}});const errors=[],log=[];page.on('pageerror',e=>errors.push(e.message));
let held=[],lastShot=-1,status='incomplete',upperMode='',lastLives=5,deaths=0;const keys={right:'ArrowRight',left:'ArrowLeft',jump:'Space',run:'Shift',swap:'KeyC',action:'x',up:'ArrowUp',down:'ArrowDown'};
const actions=[['right','run'],['right','run','jump'],['right','run','action'],['right','jump'],['right'],['jump'],[],['left','jump'],['left']];
const cloneState=s=>structuredClone(s);
const offline=s=>{const g=Object.assign(Object.create(Game.prototype),cloneState(s));g.onEvent=()=>{};g.onSave=()=>{};g.phase='playing';return g;};
const snapshot=async()=>JSON.parse(await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.entries(window.goonk).filter(([,v])=>typeof v!=='function')),(_,v)=>v instanceof Set?{$set:[...v]}:v instanceof Map?{$map:[...v]}:v)),(_,v)=>v&&typeof v==='object'&&'$set'in v?new Set(v.$set):v&&typeof v==='object'&&'$map'in v?new Map(v.$map):v);
const pack=g=>Object.fromEntries(Object.entries(g).filter(([,v])=>typeof v!=='function'));
function plan(state,heldKeys) {
 let beam=[{state,held:heldKeys,path:[],score:0}],initialHp=state.player.hp;
 for(let depth=0;depth<24;depth++) {
  const candidates=[];
  for(const node of beam)for(const action of actions) {
   const g=offline(node.state);const input=emptyInput();input.held=new Set(action);input.pressed=new Set(action.filter(k=>!node.held.includes(k)));input.released=new Set(node.held.filter(k=>!action.includes(k)));
   let lost=false;
   for(let f=0;f<6;f++){g.update(input);if(g.lives<state.lives||g.phase==='gameover'||g.levelId!==1){lost=true;break;}if(g.phase==='clear')break;}
   if(lost)continue;
   const p=g.player;let score=p.x*3+(p.x>89&&p.x<109?Math.min(0,p.y-5.5)*14:0)+(p.hp-initialHp)*25+(p.grounded?.3:0)+(p.cannon>=0?1:0);
   if(p.y < -5&&p.vy<0)score-=(Math.abs(p.y)+Math.abs(p.vy))*2;
   const below=g.supportAt(p.x,p.y,.1),ahead=g.supportAt(p.x+1.5,p.y,.1);
   if(p.grounded&&(ahead===null||ahead<p.y-1.25))score-=9;
   if(!p.grounded&&p.vy<0&&(below===null||p.y-below>4))score-=8;
   if(g.phase==='clear')score+=100000;
   candidates.push({state:pack(g),held:action,path:[...node.path,action],score});
  }
  const seen=new Set();beam=candidates.sort((a,b)=>b.score-a.score).filter(n=>{const p=n.state.player,key=[Math.round(p.x*3),Math.round(p.y*3),Math.round(p.vx),Math.round(p.vy),p.cannon,p.hp,n.held.join(',')].join(':');if(seen.has(key))return false;seen.add(key);return true;});
  const buckets=new Map();beam=beam.filter(node=>{const key=node.path[0].join(',');const count=buckets.get(key)??0;if(count>=4)return false;buckets.set(key,count+1);return true;}).slice(0,36);
  if(!beam.length)return [];
 }
 return beam[0].path[0];
}
try {
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:5174/');await page.waitForFunction(()=>!!window.goonkScene);
 await page.getByRole('button',{name:/Explorer l’île|Explorer la carte|Carte de l’île|Explore the island/}).click();
 await page.locator('.map-stage, .level-card').nth(1).click();await page.locator('.map-enter').click();
 await page.waitForFunction(()=>window.goonk.phase==='playing'&&window.goonk.levelId===1);
 let started=Date.now(),maxX=0,lastProgress=Date.now(),lastPlace={x:0,y:0};
 for(let step=0;step<1800&&Date.now()-started<900000;step++) {
  let state=await snapshot();
  if(state.phase==='clear'){status='clear';break;}
  if(state.lives<lastLives)deaths+=lastLives-state.lives;lastLives=state.lives;
  if(deaths||state.phase==='gameover'){status='death';break;}
  for(const key of held)await page.keyboard.up(keys[key]);held=[];
  await page.keyboard.press('KeyP');
  await page.waitForFunction(()=>window.goonk.phase==='paused'||window.goonk.phase==='clear');
  state=await snapshot();if(state.phase==='clear'){status='clear';break;}
  const p=state.player;
  if(Math.hypot(p.x-lastPlace.x,p.y-lastPlace.y)>.25){lastPlace={x:p.x,y:p.y};lastProgress=Date.now();}maxX=Math.max(maxX,p.x);
  if(Date.now()-lastProgress>60000){status='stuck';break;}
  writeFileSync(out+'canyon-playthrough-live-state.json',JSON.stringify(state,(_,v)=>v instanceof Set?{$set:[...v]}:v instanceof Map?{$map:[...v]}:v));
  let action;
  if(p.cannon>=14||p.x>109)upperMode='';
  if(p.cannon===12)upperMode='rise';
  if(p.x>91&&p.x<110&&p.y<5.2&&p.cannon<0&&upperMode!=='rise'&&upperMode!=='land')upperMode='recover';
  let override;
  try{const rules=JSON.parse(readFileSync(process.env.CANYON_RULES||out+'canyon-playthrough-rules.json','utf8'));override=rules.find(r=>Object.entries(r.when||{}).every(([k,v])=>Array.isArray(v)?p[k]>=(v[0]??-Infinity)&&p[k]<=(v[1]??Infinity):p[k]===v));}catch{}
  if(override)action=override.keys;
  else if(upperMode==='recover'){
    const target=offline(state).cannonPosition(12).x, dx=target-p.x-.2*p.vx;
    action=Math.abs(dx)<.18?[]:[dx>0?'right':'left',...(p.x>88?['run','jump']:[])];
  }
  else if(p.cannon===12)action=p.x>=85.5?['jump']:[];
  else if(p.cannon===24){
    const shot=offline(state),probe=emptyInput();probe.held.add('jump');probe.pressed.add('jump');
    let caught=false;
    for(let f=0;f<60;f++){shot.update(probe);if(shot.player.cannon===25){caught=true;break;}if(shot.lives<state.lives)break;}
    action=caught?['jump']:[];
  }
  else if(upperMode==='rise'){
    if(p.y>=7.6||p.vy<0)upperMode='land';
    action=upperMode==='rise'?['jump']:['right','run','jump'];
  }
  else if(upperMode==='land'){
    action=p.vy>0?['right','run','jump']:['right','run'];
    if(p.grounded)upperMode=p.y>=7.4?'route':'recover';
  }
  else if(p.cannon<0 && p.x>=69 && p.x<79 && p.y<2)action=['right'];
  else if(p.cannon<0 && p.x>=88.5 && p.x<90.1 && p.grounded && p.y>=7.4)action=['right','run'];
  else if(p.cannon<0 && p.x>=90.1 && p.x<91.2 && p.grounded && p.y>=7.4 && p.roll===0)action=['right','run','action'];
  else if(p.cannon<0 && p.x>=90.1 && p.x<99 && p.roll>0)action=p.roll>.22?['right','run']:['right','run','jump'];
  else if(p.cannon<0 && p.x>=90.1 && p.x<101 && p.rollJumpMomentum>0)action=['right','run','jump'];
  else if(p.cannon<0 && p.x>=98.8 && p.x<101.1 && p.grounded && p.y>=5.4)action=['right','run'];
  else if(p.cannon<0 && p.x>=101.1 && p.x<102 && p.grounded && p.y>=5.4)action=['right','run','jump'];
  else if(p.cannon<0 && p.x>=101 && p.x<106 && !p.grounded && p.y>=5.4)action=['right','run','jump'];
  else if(p.cannon<0 && p.x>=104 && p.x<109 && p.y>=7.4)action=['right','run'];
  else action=plan(state,held);
  await page.keyboard.press('KeyP');
  for(const key of held.filter(k=>!action.includes(k)))await page.keyboard.up(keys[key]);
  for(const key of action.filter(k=>!held.includes(k)))await page.keyboard.down(keys[key]);
  held=action;
  log.push({step,gameTime:state.time,x:p.x,y:p.y,vx:p.vx,vy:p.vy,hp:p.hp,lives:state.lives,cannon:p.cannon,keys:[...action]});
  if(step%10===0)writeFileSync(out+'canyon-playthrough-live.json',JSON.stringify(log,null,2));
  if(step%30===0)console.log(JSON.stringify(log.at(-1)));
  if(Math.floor(p.x/40)>lastShot){lastShot=Math.floor(p.x/40);await page.screenshot({path:out+`canyon-playthrough-${lastShot*40}.png`});console.log(JSON.stringify(log.at(-1)));}
  await page.waitForFunction(target=>window.goonk.time>=target||window.goonk.phase!=='playing',state.time+6/60);
 }
 for(const key of held)await page.keyboard.up(keys[key]);
 const final=await snapshot();if(final.phase==='clear')status='clear';
 await page.screenshot({path:out+'canyon-playthrough-final.png'});
 const result={status,deaths,inputOnly:true,enemyDamageEnabled:true,cannonCount:offline(final).level.barrels.filter(b=>b.kind==='cannon').length,enemiesAlive:final.enemies.filter(e=>e.alive).length,buildSources:await page.evaluate(()=>Array.from(document.scripts).map(s=>s.src).filter(Boolean)),phase:final.phase,x:final.player.x,y:final.player.y,lives:final.lives,hp:final.player.hp,time:final.time,errors,inputs:log};
 writeFileSync(out+'canyon-playthrough.json',JSON.stringify(result,null,2));
 writeFileSync(out+'canyon-playthrough.md',`# Real-input canyon playthrough\n\nResult: **${status}**, phase ${final.phase}, X=${final.player.x.toFixed(2)}, Y=${final.player.y.toFixed(2)}, lives=${final.lives}, HP=${final.player.hp}, simulated time=${final.time.toFixed(2)}s.\n\nEntered through the map and used real Playwright keyboard input. Live window.goonk was read only. Pausing during offline planning used the real KeyP control. Candidate controls were scored in isolated offline Game copies; no player positions, enemies, invincibility, lives or simulation clock were written in the running browser game.\n\nInput log: canyon-playthrough.json. Final capture: canyon-playthrough-final.png.\n`);
 if(status!=='clear'||deaths||errors.length)process.exitCode=1;
 console.log(JSON.stringify({status,phase:result.phase,x:result.x,y:result.y,lives:result.lives,hp:result.hp,time:result.time,errors,steps:log.length}));
} finally {await browser.close();await vite.close();}
