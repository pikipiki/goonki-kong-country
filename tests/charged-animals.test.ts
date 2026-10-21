import {describe,it,expect} from 'vitest';
import {Game,emptyInput,type Key} from '../src/game/engine';
import {ENGUARDE_SWIM_BODY} from '../src/game/animals';
import {coralBodyBlocked} from '../src/game/terrainSolids';
function frame(g:Game,keys:Key[]=[],pressed:Key[]=[],released:Key[]=[]) {
 const i=emptyInput();keys.forEach(k=>i.held.add(k));pressed.forEach(k=>i.pressed.add(k));released.forEach(k=>i.released.add(k));g.update(i);
}
function mount(kind:'rambi'|'enguarde') {
 const g=new Game();g.start(kind==='rambi'?0:3);g.enemies=[];
 const a=g.animals[0];a.state='ridden';g.player.mount=0;
 Object.assign(g.player,{x:kind==='rambi'?12:20,y:kind==='rambi'?0:1.8,vx:0,vy:0,grounded:kind==='rambi'});
 return g;
}
describe('requested animal attacks and boss balance',()=>{
 for(const kind of ['rambi','enguarde'] as const) {
  it(`${kind} accumulates while held, then accelerates on release`,()=>{
   const g=mount(kind);frame(g,['action'],['action']);
   for(let n=0;n<45;n++)frame(g,['action']);
   expect(g.player.mountCharge).toBeGreaterThanOrEqual(.65);expect(Math.abs(g.player.vx)).toBeLessThan(.01);
   const x=g.player.x;frame(g,[],[],['action']);
   expect(g.player.mountCharged).toBe(true);expect(g.player.mountAttack).toBeGreaterThan(.8);
   expect(g.player.vx).toBe(kind==='rambi'?16:18);expect(g.player.x).toBeGreaterThan(x);
  });
 }
 it('still attacks immediately on a short press',()=>{
  const g=mount('rambi');frame(g,[],['action']);expect(g.player.mountAttack).toBeGreaterThan(0);expect(g.player.vx).toBe(9);
 });
 it('Enguarde can rise on the imported reef while carrying the plush',()=>{
  const g=new Game();g.start(3,true);g.enemies=[];const a=g.animals[0];a.state='idle';
  Object.assign(g.player,{x:a.x,y:a.y,vx:0,vy:0});frame(g);
  expect(g.mount?.kind).toBe('enguarde');const y=g.player.y;
  for(let n=0;n<25;n++)frame(g,['up']);
  expect(g.player.y).toBeGreaterThan(y+.65);expect(coralBodyBlocked(g.player.x,g.player.y,ENGUARDE_SWIM_BODY)).toBe(false);
 });
 it('Expresso floats and advances while jump is held, then descends when released',()=>{
  const g=new Game();g.start(4);g.enemies=[];g.animals[0].state='ridden';g.player.mount=0;
  Object.assign(g.player,{x:20,y:5,vy:-8,grounded:false});const x=g.player.x;
  for(let n=0;n<60;n++)frame(g,['jump','right']);
  expect(g.player.x).toBeGreaterThan(x+3);expect(g.player.y).toBeGreaterThan(4.3);
  for(let n=0;n<20;n++)frame(g);expect(g.player.vy).toBeLessThan(-2);
 });
 for(const timer of [.1,2.8]) it(`a thrown barrel damages the boss at cycle ${timer}`,()=>{
  const g=new Game();g.start(6);const b=g.enemies[0];b.timer=timer;g.player.x=b.x-5;
  g.thrown.push({x:b.x-.2,y:1,vx:1,vy:0,active:true});frame(g);
  expect(b.hp).toBe(4);expect(g.thrown.some(t=>t.active)).toBe(false);expect(g.player.hp).toBe(2);
 });
 it('picks up the actual arena barrel and throws it all the way into the boss',()=>{
  const g=new Game();g.start(6);const boss=g.enemies[0];g.player.x=10;
  frame(g,['action'],['action']);expect(g.player.carry).toBe(1);
  frame(g,[],[],['action']);expect(g.player.carry).toBe(-1);expect(g.thrown.length).toBe(1);
  for(let n=0;n<300 && boss.hp===5;n++)frame(g);
  expect(boss.hp).toBe(4);expect(g.player.hp).toBe(2);
 });
 for(const timer of [0,.6,1.2,2.6]) it(`can jump past the boss safely from its approach at cycle ${timer}`,()=>{
  const g=new Game();g.start(6);const b=g.enemies[0];b.timer=timer;g.player.x=b.x-4;let hurt={};g.onEvent=e=>{if(e==='hurt')hurt={player:{...g.player},boss:{...b}};};
  frame(g,['jump','right','run'],['jump']);
  for(let n=0;n<75;n++) {
   frame(g,g.player.x<b.x+.3?['jump','right','run']:['jump']);
  }
  expect(g.player.hp,JSON.stringify(hurt)).toBe(2);
 });

 it('gives Rose the faster roll and Violette the former Rose speed',()=>{
  const speeds=[];
  for(const active of [0,1]) {
   const g=new Game();g.start(0);g.animals=[];g.enemies=[];
   Object.assign(g.player,{active,x:40,grounded:true,recentRun:0});
   frame(g,['right','run'],['action']);speeds.push(g.player.rollSpeed);
  }
  expect(speeds[0]).toBe(speeds[1]*1.125);
 });

});
