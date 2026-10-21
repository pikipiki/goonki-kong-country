import {expect,it} from 'vitest';
import {normalizeLandEnemyFeet,mineBeePatrolBounds} from '../src/game/routeSafety';
import {terrainSolidSpans} from '../src/game/terrainSolids';
import {ROM_REVERB} from '../src/game/originalReverb';
import {ROM_MINE_CART} from '../src/game/originalMineCart';
import {ENEMY_DESIGNS} from '../src/game/enemies';

it('places all canyon land enemies above an exposed floor with body headroom',()=>{
 let placed=0;
 for(const enemy of ROM_REVERB.enemies.filter(e=>e.kind!=='bee')) {
  const design=ENEMY_DESIGNS[enemy.kind],body={radius:design.width*.65,height:design.height};
  const y=normalizeLandEnemyFeet('cave',enemy.x,enemy.y,body);
  expect(y,`no support at ${enemy.x}`).not.toBeNull();
  for(const x of [enemy.x-body.radius,enemy.x,enemy.x+body.radius]) {
   expect(terrainSolidSpans('cave',x).some(s=>y!+body.height>s.bottom+.015&&y!<s.top-.015),`embedded at ${enemy.x}`).toBe(false);
  }
  placed++;
 }
 expect(placed).toBeGreaterThan(20);
 const e=ROM_REVERB.enemies[0],body={radius:.4,height:1.2};
 const floor=normalizeLandEnemyFeet('cave',e.x,e.y,body)!;
 expect(normalizeLandEnemyFeet('cave',e.x,floor-.6,body)).toBe(floor);
});
it('keeps imported mine Zingers near their anchors and in encounter order',()=>{
 const bees=ROM_MINE_CART.enemies.filter(e=>e.kind==='bee'&&e.pattern!=='necky');
 for(const bee of bees) {
  const bounds=mineBeePatrolBounds(bee,ROM_MINE_CART.enemies,ROM_MINE_CART.length);
  expect(bounds.min).toBeLessThanOrEqual(bee.x);expect(bounds.max).toBeGreaterThanOrEqual(bee.x);
  expect(bounds.max-bounds.min).toBeLessThanOrEqual(1.201);
  for(const other of bees.filter(e=>e.x>bee.x))expect(bounds.max).toBeLessThan(mineBeePatrolBounds(other,ROM_MINE_CART.enemies,ROM_MINE_CART.length).min);
 }
});

import {cannonMomentumDuration} from '../src/game/routeSafety';
import {Game,emptyInput} from '../src/game/engine';
import playerSource from '../reference/player-states.json';

it('keeps source cannon vertical velocities in the same positive-up frame as jumps',()=>{
 const source=playerSource.cannonBaseTemplateVectors.find(v=>v.quantizedAngleRaw===0x8000)!;
 expect(source.velocityYRaw).toBeGreaterThan(0);
 const g=new Game();g.start(1,true);g.enemies=[];g.animals=[];
 const b=g.level.barrels[1];Object.assign(g.player,{x:b.x,y:b.y,cannon:1,grounded:false});
 const input=emptyInput();input.pressed.add('action');g.update(input);
 expect(g.player.vy).toBeGreaterThan(15);
 expect(g.player.y).toBeGreaterThan(b.y);
});

for(const index of [9,36])it(`lands safely after the real horizontal canyon cannon ${index} without early braking`,()=>{
 const g=new Game();g.start(1,true);g.enemies=[];g.animals=[];
 const b=g.level.barrels[index];Object.assign(g.player,{x:b.x,y:b.y,cannon:index,grounded:false,invincible:100});
 const input=emptyInput();input.pressed.add('action');g.update(input);
 expect(g.player.launched).toBeGreaterThanOrEqual(cannonMomentumDuration(b)-1/60);
 let completed=false;
 for(let frame=0;frame<330;frame++) {
  g.update(emptyInput());
  expect(g.lives).toBe(5);
  if(g.player.cannon>=0 || g.player.grounded) {completed=true;break;}
 }
 expect(completed).toBe(true);expect(g.player.x).toBeGreaterThan(b.x+10);
});

it('chains the four actual alternating canyon cannons at x276..292.75',()=>{
 const g=new Game();g.start(1,true);g.enemies=[];g.animals=[];
 const b=g.level.barrels[32];Object.assign(g.player,{x:b.x,y:b.y,cannon:32,grounded:false,invincible:100});
 const captures=[32];
 for(let frame=0;frame<130 && captures.at(-1)!==35;frame++) {
  const input=emptyInput();if(g.player.cannon>=0)input.pressed.add('action');g.update(input);
  if(g.player.cannon>=0 && captures.at(-1)!==g.player.cannon)captures.push(g.player.cannon);
  expect(g.lives).toBe(5);
 }
 expect(captures).toEqual([32,33,34,35]);
});

for(const [phase,lead,heldFrames] of [[0,6,3],[Math.PI/4,3.5,18],[Math.PI/2,3,9],[Math.PI*3/4,3.5,27]])
it(`permits one jump past the real stacked mine Zingers at hover phase ${phase.toFixed(2)}`,()=>{
 const g=new Game();g.start(2,true);const anchor=297.5;
 g.enemies=g.enemies.filter(e=>e.kind==='bee'&&e.pattern!=='necky'&&Math.abs(e.x-anchor)<.01);
 expect(g.enemies).toHaveLength(2);g.animals=[];
 g.level.barrels.forEach((_,i)=>g.usedBarrels.add(i));
 const x=anchor-8,y=normalizeLandEnemyFeet('mineCart',x,g.enemies[0].originY-1.5,{radius:.3,height:1.35});
 expect(y).not.toBeNull();Object.assign(g.player,{x,y,grounded:true,vx:8.5,vy:0,coyote:.1,invincible:0});
 for(const e of g.enemies)e.timer=phase;
 let jumpAt=-1;
 for(let frame=0;frame<150&&g.player.x<anchor+9;frame++) {
  const input=emptyInput();
  if(jumpAt<0&&g.player.x>=anchor-lead){jumpAt=frame;input.pressed.add('jump');}
  if(jumpAt>=0&&frame-jumpAt<heldFrames)input.held.add('jump');
  g.update(input);expect(g.lives).toBe(5);expect(g.player.hp).toBe(2);
 }
 expect(g.player.x).toBeGreaterThanOrEqual(anchor+9);
});


it('lets the cart queue its next jump shortly before landing',()=>{
 const g=new Game();g.start(2);g.enemies=[];g.animals=[];
 Object.assign(g.player,{x:10,y:1.2,vy:-3,grounded:false});
 let jumps=0;g.onEvent=name=>{if(name==='jump')jumps++;};
 const input=emptyInput();input.pressed.add('jump');g.update(input);
 for(let n=0;n<24 && !jumps;n++)g.update(emptyInput());
 expect(jumps).toBe(1);expect(g.player.vy).toBeGreaterThan(0);
});
it('allows stomping a Necky bird while keeping real Zingers dangerous',()=>{
 for(const pattern of ['necky',undefined] as const) {
  const g=new Game();g.start(2,true);
  const bird=g.enemies.find(e=>e.pattern==='necky')!;
  bird.pattern=pattern;bird.vx=0;g.enemies=[bird];g.animals=[];
  Object.assign(g.player,{x:bird.x,y:bird.y+ENEMY_DESIGNS.bee.height+.01,vy:-8,grounded:false});
  g.update(emptyInput());
  expect(bird.alive).toBe(pattern!=='necky');expect(g.player.hp).toBe(pattern==='necky'?2:1);
 }
});

import {mineEncounterClearance} from '../src/game/routeSafety';
function runCloseMinePair(anchor:number,distance:number,placement:number,sign:number,lead:number,held:number) {
 const g=new Game();g.start(2,true);
 g.enemies=g.enemies.filter(e=>e.kind==='bee'&&e.pattern!=='necky'&&e.x>=anchor-.01&&e.x<=anchor+6.5);
 const goal=Math.max(...g.enemies.map(e=>e.x))+1.6;
 const source=g.level.enemies.find(e=>Math.abs(e.x-anchor)<.01)!;
 const x=anchor-distance,y=normalizeLandEnemyFeet('mineCart',x,source.y-1.5,{radius:.3,height:1.35});
 if(y===null)return false;
 Object.assign(g.player,{x,y,grounded:true,vx:8.5,vy:0,coyote:.1,invincible:0});
 g.animals=[];g.level.barrels.forEach((_,i)=>g.usedBarrels.add(i));
 for(const e of g.enemies){e.x=e.min+(e.max-e.min)*placement;e.vx=Math.abs(e.vx)*sign;e.timer=2.356;}
 let jumpAt=-1;
 for(let f=0;f<180&&g.player.x<goal;f++) {
  const input=emptyInput();
  if(lead>=0&&jumpAt<0&&g.player.x>=g.enemies[0].x-lead){jumpAt=f;input.pressed.add('jump');}
  if(jumpAt>=0&&f-jumpAt<held)input.held.add('jump');
  g.update(input);if(g.lives!==5||g.player.hp!==2)return false;
 }
 return g.player.x>=goal;
}
it('adapts close mine formations on runtime copies and keeps a real low jump obstacle',()=>{
 const source=JSON.stringify(ROM_MINE_CART.enemies),adapted=mineEncounterClearance(ROM_MINE_CART.enemies);
 expect(JSON.stringify(ROM_MINE_CART.enemies)).toBe(source);expect(adapted).toHaveLength(ROM_MINE_CART.enemies.length);
 const changed=adapted.filter((e,i)=>e.y!==ROM_MINE_CART.enemies[i].y);
 expect(changed.map(e=>e.x)).toEqual([114.90625,269.34375,272.84375,372.84375,377.46875,381.96875,412.90625]);
 expect(changed.every(e=>e.hoverAmplitude===0)).toBe(true);
 for(const anchor of [269.34375,372.84375]) {
  const lower=adapted.find(e=>e.x===anchor)!,original=ROM_MINE_CART.enemies.find(e=>e.x===anchor)!;
  expect(original.y-lower.y).toBeLessThanOrEqual(.401);
  expect(runCloseMinePair(anchor,anchor===269.34375?8:7,.5,1,-1,0)).toBe(false);
 }
 expect(adapted.filter(e=>e.x===297.5).map(e=>e.y)).toEqual(ROM_MINE_CART.enemies.filter(e=>e.x===297.5).map(e=>e.y));
});
for(const [anchor,distance] of [[269.34375,8],[372.84375,7],[377.46875,8]])
it(`leaves a playable jump corridor near mine X=${anchor} at both patrol directions and extremes`,()=>{
 for(const placement of [0,.5,1])for(const sign of [-1,1]) {
  let safe=false;
  for(let lead=.5;lead<=6&&!safe;lead+=.25)for(let held=3;held<=45&&!safe;held+=3)
   safe=runCloseMinePair(anchor,distance,placement,sign,lead,held);
  expect(safe,`placement=${placement}, direction=${sign}`).toBe(true);
 }
});
