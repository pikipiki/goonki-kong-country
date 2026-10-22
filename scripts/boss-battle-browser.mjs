// Real keyboard playthrough: window.goonk is read only. Planning simulates
// isolated Game copies while the real KeyP control pauses the browser game.
// No position, HP, life, clock, enemy, or invincibility writes in the live game.
import {chromium} from 'playwright';
import {createServer} from 'vite';
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)).replace(/\/$/,''),out=root+'/reference/';
const vite=await createServer({root,server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'silent'});
const {Game,emptyInput}=await vite.ssrLoadModule('/src/game/engine.ts');
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const page=await browser.newPage({viewport:{width:1100,height:700}}),errors=[],log=[];
page.on('pageerror',e=>errors.push(e.message));
const keys={right:'ArrowRight',left:'ArrowLeft',jump:'Space',run:'Shift',swap:'KeyC',action:'x'},actions=[[],['left','run'],['right','run'],['jump'],['left','run','jump'],['right','run','jump'],['action']];
const offline=s=>{const g=Object.assign(Object.create(Game.prototype),structuredClone(s));g.onEvent=()=>{};g.onSave=()=>{};g.phase='playing';return g};
const pack=g=>Object.fromEntries(Object.entries(g).filter(([,v])=>typeof v!=='function'));
const snapshot=async()=>JSON.parse(await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.entries(window.goonk).filter(([,v])=>typeof v!=='function')),(_,v)=>v instanceof Set?{$set:[...v]}:v instanceof Map?{$map:[...v]}:v)),(_,v)=>v&&typeof v==='object'&&'$set'in v?new Set(v.$set):v&&typeof v==='object'&&'$map'in v?new Map(v.$map):v);
function plan(s,held){
 let beam=[{state:s,held,path:[],score:0}];
 for(let depth=0;depth<16;depth++){
  let ns=[];
  for(const node of beam)for(const action of actions){
   const g=offline(node.state),i=emptyInput();i.held=new Set(action);i.pressed=new Set(action.filter(k=>!node.held.includes(k)));i.released=new Set(node.held.filter(k=>!action.includes(k)));
   for(let f=0;f<8;f++)g.update(i);
   if(g.lives<s.lives||g.phase==='gameover')continue;
   const p=g.player,b=g.enemies[0],st=g.bossBattle;
   let score=(g.lives*2+p.hp)*100000+st.hits*10000;
   if(g.phase==='victory')score+=10000000;
   const dx=b.x-p.x,dist=Math.abs(dx);
   if(st.phase==='catch')score-=dist*12+Math.abs(p.y-2)*2;
   else if(['intro','throw','hurt'].includes(st.phase))score-=Math.abs(dist-3.8)*3;
   else if(st.phase==='run'||st.phase==='jump')score+=Math.min(5,dist)*5;
   // Retain central maneuvering space, avoid sitting at a boundary.
   score-=Math.max(0,2-p.x)*5+Math.max(0,p.x-20)*5;
   ns.push({state:pack(g),held:action,path:[...node.path,action],score});
  }
  const seen=new Set();beam=ns.sort((a,b)=>b.score-a.score).filter(n=>{const p=n.state.player,key=[Math.round(p.x*3),Math.round(p.y*3),Math.round(p.vx),Math.round(p.vy),p.hp,n.state.bossBattle.hits,n.held.join(',')].join(':');if(seen.has(key))return false;seen.add(key);return true}).slice(0,18);
  if(!beam.length)return [];
 }
 return beam[0].path[0];
}
let held=[],status='incomplete',lastHits=-1,lastLives=5,deaths=0;
try{
 await page.goto((process.env.GAME_URL||'http://127.0.0.1:5174/').replace(/\/?$/,'/')+'?demo=2d&stage=boss');await page.waitForFunction(()=>window.goonk?.phase==='playing'&&window.goonk.levelId===6);await page.waitForTimeout(600);
 const start=Date.now();
 for(let step=0;step<1200&&Date.now()-start<300000;step++){
  let s=await snapshot();if(s.phase==='victory'){status='victory';break;}if(s.lives<lastLives)deaths+=lastLives-s.lives;lastLives=s.lives;if(deaths){status='death';break;}
  await page.keyboard.press('KeyP');await page.waitForFunction(()=>window.goonk.phase==='paused'||window.goonk.phase==='victory');s=await snapshot();
  if(s.phase==='victory'){status='victory';break;}
  const action=plan(s,held);log.push({step,time:s.time,x:s.player.x,y:s.player.y,hp:s.player.hp,lives:s.lives,hits:s.bossBattle.hits,phase:s.bossBattle.phase,keys:action});
  if(s.bossBattle.hits!==lastHits||step%30===0){console.log(JSON.stringify(log.at(-1)));lastHits=s.bossBattle.hits;writeFileSync(out+'boss-playthrough-live.json',JSON.stringify(log,null,2));await page.screenshot({path:out+'boss-playthrough-live.png'});}
  for(const k of held)await page.keyboard.up(keys[k]);
  await page.keyboard.press('KeyP');
  for(const k of action)await page.keyboard.down(keys[k]);held=action;await page.waitForFunction(t=>window.goonk.time>=t||window.goonk.phase!=='playing',s.time+8/60);
 }
 for(const k of held)await page.keyboard.up(keys[k]);const s=await snapshot();if(s.phase==='victory')status='victory';
 await page.screenshot({path:out+'boss-playthrough-final.png'});
 writeFileSync(out+'boss-playthrough.json',JSON.stringify({status,deaths,inputOnly:true,damageEnabled:true,liveStateWrites:false,phase:s.phase,hits:s.bossBattle?.hits,hp:s.player.hp,lives:s.lives,time:s.time,errors,inputs:log},null,2));
 console.log(JSON.stringify({status,deaths,phase:s.phase,hits:s.bossBattle?.hits,hp:s.player.hp,lives:s.lives,time:s.time,errors}));
 if(status!=='victory'||deaths)process.exitCode=1;
}finally{await browser.close();await vite.close();}
