/** K. Rool sequence families/counts follow USA Rev2 DATA_B6EB45.
 * Durations and world velocities are adapted to plush-sized mobile play. */
export type BossPhase = 'intro'|'throw'|'catch'|'run'|'jump'|'rain'|'hurt'|'fakeDeath'|'getUp'|'dead';
export interface BossActor {x:number;y:number;vx:number;vy:number;min:number;max:number;hp:number;vulnerable:boolean;bossState?:BossPhase;bossFacing?:number;bossCrowned?:boolean}
export interface BossProjectile {kind:'crown'|'cannonball';x:number;y:number;vx:number;vy:number;active:boolean;width:number;height:number;age:number;warning:number;returning:boolean;rotation:number}
export interface BossBattle {phase:BossPhase;phaseTime:number;hits:number;maxHits:number;crowned:boolean;facing:number;left:number;right:number;passes:number;jumps:number;hopTime:number;rainCount:number;spawned:number;ballClock:number;afterJumps:'rain'|'throw';totalTime:number}
export const BOSS_MAX_HITS = 10;
export function createBossBattle(b:BossActor):BossBattle {
 return {phase:'intro',phaseTime:0,hits:0,maxHits:BOSS_MAX_HITS,crowned:true,facing:-1,left:b.min-1,right:b.max+1,passes:0,jumps:0,hopTime:0,rainCount:0,spawned:0,ballClock:0,afterJumps:'throw',totalTime:0};
}
function phase(s:BossBattle,next:BossPhase){s.phase=next;s.phaseTime=0;}
function jumping(s:BossBattle,count:number,after:'rain'|'throw'){s.jumps=count;s.hopTime=0;s.afterJumps=after;phase(s,'jump');}
export function registerBossHit(s:BossBattle,b:BossActor,shots:BossProjectile[]) {
 s.hits=Math.max(s.hits+1,s.maxHits-b.hp);s.crowned=true;b.vulnerable=false;b.vx=0;b.vy=0;b.y=0;
 shots.forEach(p=>p.active=false);
 phase(s,b.hp<=0?'dead':'hurt');
}
export function bossAcceptsHit(s:BossBattle){return !['hurt','fakeDeath','getUp','dead'].includes(s.phase);}
export function updateBossBattle(s:BossBattle,b:BossActor,shots:BossProjectile[],dt:number,onEvent:(name:string)=>void=()=>{}) {
 s.phaseTime+=dt;s.totalTime+=dt;b.vx=0;b.vy=0;
 const low=s.left+1,high=s.right-1;
 if(s.phase==='intro'){
  b.y=Math.abs(Math.sin(Math.min(1,s.phaseTime/1.8)*Math.PI*3))*.7;
  if(s.phaseTime>=1.8){b.y=0;phase(s,'throw');}
 }else if(s.phase==='throw'){
  b.y=0;s.crowned=true;
  if(s.phaseTime>=.65){
   s.facing=b.x>(s.left+s.right)/2?-1:1;s.crowned=false;
   shots.push({kind:'crown',x:b.x+s.facing*.9,y:1.35,vx:s.facing*(6+s.hits*.45),vy:0,active:true,width:.38,height:.34,age:0,warning:0,returning:false,rotation:0});
   phase(s,'catch');onEvent('boss-crown');
  }
 }else if(s.phase==='catch'){
  b.y=0;
  if(!shots.some(p=>p.active&&p.kind==='crown')&&s.phaseTime>.3){s.crowned=true;phase(s,'throw');}
 }else if(s.phase==='hurt'){
  b.y=0;
  if(s.phaseTime>=.85){
   if(s.hits<=3){s.passes=s.hits;s.facing=b.x>(low+high)/2?-1:1;phase(s,'run');}
   else if(s.hits<=6){s.rainCount=[9,17,25][s.hits-4];jumping(s,3,'rain');}
   else if(s.hits===7)phase(s,'fakeDeath');
   else jumping(s,s.hits===8?6:12,'throw');
  }
 }else if(s.phase==='run'){
  const speed=5+s.hits*.8+(s.hits-s.passes)*.65;
  b.vx=s.facing*speed;b.x+=b.vx*dt;b.y=0;
  if(b.x<=low||b.x>=high){b.x=Math.max(low,Math.min(high,b.x));s.passes--;s.facing*=-1;if(s.passes<=0)phase(s,'throw');}
 }else if(s.phase==='jump'){
  s.hopTime+=dt;const duration=s.hits>=7?.62:.85,height=s.hits>=7?2.2:3.1;
  b.vx=s.facing*(s.hits>=7?7.5:5);b.x+=b.vx*dt;
  if(b.x<=low||b.x>=high){b.x=Math.max(low,Math.min(high,b.x));s.facing*=-1;}
  b.y=Math.sin(Math.min(1,s.hopTime/duration)*Math.PI)*height;
  if(s.hopTime>=duration){s.hopTime=0;s.jumps--;b.y=0;onEvent('boss-land');if(s.jumps<=0){if(s.afterJumps==='rain'){s.spawned=0;s.ballClock=0;phase(s,'rain');}else phase(s,'throw');}}
 }else if(s.phase==='rain'){
  b.y=0;s.ballClock+=dt;
  if(s.spawned<s.rainCount&&s.ballClock>=.23){
   s.ballClock-=.23;const row=Math.floor(s.spawned/9),col=s.spawned%9;
   const x=s.left+1+(row%2?8-col:col)*(s.right-s.left-2)/8;
   shots.push({kind:'cannonball',x,y:8.2,vx:0,vy:0,active:true,width:.34,height:.68,age:0,warning:.55,returning:false,rotation:0});
   s.spawned++;onEvent('boss-ball');
  }
  if(s.spawned>=s.rainCount&&!shots.some(p=>p.active&&p.kind==='cannonball'))phase(s,'throw');
 }else if(s.phase==='fakeDeath'){
  b.y=0;
  if(s.phaseTime>=4)phase(s,'getUp');
 }else if(s.phase==='getUp'){
  b.y=0;if(s.phaseTime>=1){jumping(s,2,'throw');onEvent('boss-revive');}
 }else if(s.phase==='dead')b.y=0;
 for(const p of shots){
  if(!p.active)continue;p.age+=dt;p.rotation+=dt*(p.kind==='crown'?12:4);
  if(p.kind==='crown'){
   if(!p.returning&&(p.x<s.left-.7||p.x>s.right+.7)){p.returning=true;p.vx*=-1;}
   p.x+=p.vx*dt;p.y=1.35+Math.sin(p.age*5)*.08;
   if(p.returning&&Math.abs(p.x-b.x)<.7)p.active=false;
  }else if(p.warning>0)p.warning=Math.max(0,p.warning-dt);
  else {p.vy-=21*dt;p.y+=p.vy*dt;if(p.y<-.55)p.active=false;}
 }
 b.x=Math.max(low,Math.min(high,b.x));b.vulnerable=s.phase==='catch'&&!s.crowned;
 b.bossState=s.phase;b.bossFacing=s.facing;b.bossCrowned=s.crowned;
}
