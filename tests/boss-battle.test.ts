import { describe, expect, it } from 'vitest';
import { BOSS_MAX_HITS, bossAcceptsHit, createBossBattle, registerBossHit, updateBossBattle, type BossActor, type BossBattle, type BossProjectile } from '../src/game/bossBattle';
import { Game, STEP, emptyInput } from '../src/game/engine';
import { ENEMY_DESIGNS } from '../src/game/enemies';

const actor = (): BossActor => ({x:17,y:0,vx:0,vy:0,min:4,max:18,hp:BOSS_MAX_HITS,vulnerable:false});
const crown = (x=5): BossProjectile => ({kind:'crown',x,y:1.35,vx:-6,vy:0,active:true,width:.38,height:.34,age:0,warning:0,returning:false,rotation:0});
function simulateUntil(state:BossBattle,b:BossActor,shots:BossProjectile[],predicate:()=>boolean,maxSeconds=35) {
  for(let frame=0;frame<maxSeconds/STEP;frame++) {
    if(predicate())return;
    updateBossBattle(state,b,shots,STEP);
  }
  expect(predicate(),JSON.stringify({phase:state.phase,phaseTime:state.phaseTime,jumps:state.jumps,passes:state.passes,spawned:state.spawned})).toBe(true);
}
function afterHit(hits:number) {
  const b=actor(),s=createBossBattle(b),shots:BossProjectile[]=[];
  s.hits=hits-1;b.hp=BOSS_MAX_HITS-hits;registerBossHit(s,b,shots);
  return {b,s,shots};
}

describe('final battle sequence adapted from the supplied ROM',()=>{
  it('throws and returns the crown, exposing the head only during its flight',()=>{
    const b=actor(),s=createBossBattle(b),shots:BossProjectile[]=[];
    expect(s.crowned).toBe(true);expect(b.vulnerable).toBe(false);
    simulateUntil(s,b,shots,()=>s.phase==='catch');
    expect(shots.filter(p=>p.active&&p.kind==='crown')).toHaveLength(1);
    expect(s.crowned).toBe(false);expect(b.vulnerable).toBe(true);
    simulateUntil(s,b,shots,()=>s.phase==='throw');
    expect(shots.some(p=>p.active&&p.kind==='crown')).toBe(false);
    expect(s.crowned).toBe(true);expect(b.vulnerable).toBe(false);
  });
  for(const hits of [1,2,3]) it(`runs ${hits} passes after hit ${hits}`,()=>{
    const {b,s,shots}=afterHit(hits);
    simulateUntil(s,b,shots,()=>s.phase==='run');
    expect(s.passes).toBe(hits);
    const turns:number[]=[];let previous=s.passes;
    simulateUntil(s,b,shots,()=>{
      if(s.passes!==previous){turns.push(s.passes);previous=s.passes;}
      return s.phase==='throw';
    });
    expect(turns).toEqual(Array.from({length:hits},(_,i)=>hits-i-1));
    expect(b.x).toBeGreaterThanOrEqual(b.min);expect(b.x).toBeLessThanOrEqual(b.max);
  });
  for(const [hits,count] of [[4,9],[5,17],[6,25]]) it(`drops ${count} warned cannonballs after hit ${hits}`,()=>{
    const {b,s,shots}=afterHit(hits);
    simulateUntil(s,b,shots,()=>s.phase==='jump');expect(s.jumps).toBe(3);
    simulateUntil(s,b,shots,()=>s.phase==='rain');
    let total=0;const warned:number[]=[];
    for(let f=0;f<35/STEP&&s.phase!=='throw';f++) {
      const old=shots.length;updateBossBattle(s,b,shots,STEP);
      for(const p of shots.slice(old)){total++;warned.push(p.warning);expect(p.y).toBeGreaterThan(8);}
    }
    expect(total).toBe(count);expect(s.spawned).toBe(count);expect(s.phase).toBe('throw');
    expect(warned.every(w=>w>.5)).toBe(true);
    expect(shots.filter(p=>p.kind==='cannonball'&&p.active)).toHaveLength(0);
  });
  it('fakes defeat after seven hits, gets up, then performs two hops',()=>{
    const {b,s,shots}=afterHit(7);
    simulateUntil(s,b,shots,()=>s.phase==='fakeDeath');
    expect(b.hp).toBe(3);expect(bossAcceptsHit(s)).toBe(false);
    for(let frame=0;frame<180;frame++)updateBossBattle(s,b,shots,STEP);
    expect(s.phase).toBe('fakeDeath');
    simulateUntil(s,b,shots,()=>s.phase==='getUp');expect(bossAcceptsHit(s)).toBe(false);
    simulateUntil(s,b,shots,()=>s.phase==='jump');expect(s.jumps).toBe(2);
    simulateUntil(s,b,shots,()=>s.phase==='throw');expect(b.hp).toBe(3);
  });
  for(const [hits,hops] of [[8,6],[9,12]]) it(`performs ${hops} hops after hit ${hits}`,()=>{
    const {b,s,shots}=afterHit(hits);
    simulateUntil(s,b,shots,()=>s.phase==='jump');expect(s.jumps).toBe(hops);
    let lands=0;
    for(let f=0;f<12/STEP&&s.phase==='jump';f++)updateBossBattle(s,b,shots,STEP,event=>{if(event==='boss-land')lands++;});
    expect(lands).toBe(hops);expect(s.phase).toBe('throw');
  });
  it('requires ten hits and clears existing attacks on every registered hit',()=>{
    const b=actor(),s=createBossBattle(b),shots=[crown()];
    for(let hit=1;hit<=10;hit++){
      b.hp--;registerBossHit(s,b,shots);
      expect(s.hits).toBe(hit);expect(s.phase).toBe(hit===10?'dead':'hurt');
      expect(shots.every(p=>!p.active)).toBe(true);
    }
    expect(bossAcceptsHit(s)).toBe(false);
  });
});

describe('final battle game integration and fairness',()=>{
  it('freezes the boss and all projectiles while paused',()=>{
    const game=new Game();game.start(6);game.bossProjectiles.push(crown());game.pause();
    const before=JSON.stringify({boss:game.bossBattle,enemy:game.enemies[0],shots:game.bossProjectiles,time:game.time});
    for(let f=0;f<120;f++)game.update(emptyInput());
    expect(JSON.stringify({boss:game.bossBattle,enemy:game.enemies[0],shots:game.bossProjectiles,time:game.time})).toBe(before);
  });
  for(const kind of ['crown','cannonball'] as const) it(`ordinary ${kind} contact still damages the player`,()=>{
    const game=new Game();game.start(6);game.player.x=5;game.player.y=0;game.player.invincible=0;
    game.bossProjectiles.push({...crown(5),kind,vx:0,warning:0,y:.7});
    game.update(emptyInput());expect(game.player.hp).toBe(1);expect(game.lives).toBe(5);
  });
  it('a warned cannonball is visible preparation rather than an immediate hit',()=>{
    const game=new Game();game.start(6);game.player.x=5;game.player.invincible=0;
    game.bossProjectiles.push({...crown(5),kind:'cannonball',vx:0,warning:.55,y:.7});
    game.update(emptyInput());expect(game.player.hp).toBe(2);
  });
  for(const active of [0,1]) it(`plush ${active} can land a held jump from the deck on the exposed head without taking damage`,()=>{
    const game=new Game();game.start(6);const boss=game.enemies[0];
    game.player.active=active;game.player.x=boss.x-4;game.player.invincible=0;
    Object.assign(game.bossBattle!,{phase:'catch',phaseTime:0,crowned:false});game.bossProjectiles.push(crown());
    const input=emptyInput();input.held.add('jump');input.held.add('right');input.held.add('run');input.pressed.add('jump');
    let maxHeight=0;
    for(let frame=0;frame<120&&boss.hp===BOSS_MAX_HITS;frame++){
      if(game.player.x>=boss.x-.3)input.held.delete('right');
      game.update(input);maxHeight=Math.max(maxHeight,game.player.y);
    }
    expect(maxHeight).toBeGreaterThan(ENEMY_DESIGNS.boss.height);
    expect(boss.hp).toBe(BOSS_MAX_HITS-1);expect(game.player.hp).toBe(2);expect(game.lives).toBe(5);
  });
  it('safely bounces on the crowned head without causing damage to either actor',()=>{
    const game=new Game();game.start(6);const boss=game.enemies[0];
    Object.assign(game.bossBattle!,{phase:'throw',phaseTime:0,crowned:true});
    Object.assign(game.player,{x:boss.x,y:ENEMY_DESIGNS.boss.height+.03,vy:-7,invincible:0});
    game.update(emptyInput());expect(boss.hp).toBe(BOSS_MAX_HITS);expect(game.player.hp).toBe(2);expect(game.player.vy).toBeGreaterThan(0);
  });
  it('does not finish on the fake collapse but finishes after the final defeat animation',()=>{
    const game=new Game();game.start(6);const boss=game.enemies[0];
    Object.assign(game.bossBattle!,{phase:'fakeDeath',phaseTime:0,hits:7});boss.hp=3;
    for(let f=0;f<200;f++)game.update(emptyInput());expect(game.phase).toBe('playing');expect(boss.alive).toBe(true);
    boss.hp=0;registerBossHit(game.bossBattle!,boss,game.bossProjectiles);
    game.update(emptyInput());expect(game.phase).toBe('playing');expect(boss.alive).toBe(true);
    for(let f=0;f<100;f++)game.update(emptyInput());expect(game.phase).toBe('victory');expect(boss.alive).toBe(false);
  });
});
