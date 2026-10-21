import {expect,it} from 'vitest';
import {Game,emptyInput} from '../src/game/engine';
import {ROM_MINE_CART} from '../src/game/originalMineCart';
import {mineEncounterClearance} from '../src/game/routeSafety';

for(const birdX of [106.28125,404.34375])for(const active of [0,1])
it(`lands safely after bird ${birdX} with plush ${active}, including short mobile taps`,()=>{
 for(const phase of [0,Math.PI/2,Math.PI,Math.PI*1.5])for(const held of [0,21,90]) {
  const g=new Game();g.start(2,true);let bounced=false,hurt=false;
  const bird=g.enemies.find(e=>e.pattern==='necky'&&e.x===birdX)!;
  for(const e of g.enemies){e.timer=phase/(e.pattern==='necky'?1.55:2);e.y=e.originY+Math.sin(phase)*(e.pattern==='necky'?.42:e.hoverAmplitude??.6);}
  Object.assign(g.player,{active,x:bird.x-.6,y:bird.y+.78,vy:-8,vx:8.5,grounded:false,invincible:0});
  g.onEvent=e=>{if(e==='bounce')bounced=true;if(e==='hurt')hurt=true;};
  const goal=birdX<200?124:430;
  for(let f=0;f<260&&g.player.x<goal&&!hurt;f++){
   const i=emptyInput();if(f<held)i.held.add('jump');g.update(i);
  }
  const evidence=JSON.stringify({birdX,active,phase,held,player:g.player});
  expect(bounced,evidence).toBe(true);expect(hurt,evidence).toBe(false);
  expect(g.lives,evidence).toBe(5);expect(g.player.hp,evidence).toBe(2);
  expect(g.player.x,evidence).toBeGreaterThanOrEqual(goal);
  expect(g.player.grounded,evidence).toBe(true);expect(g.player.cartRebound,evidence).toBe(false);
 }
});
it('preserves source enemy anchors and keeps all mine Zingers alive and dangerous',()=>{
 const before=JSON.stringify(ROM_MINE_CART.enemies),adapted=mineEncounterClearance(ROM_MINE_CART.enemies);
 expect(JSON.stringify(ROM_MINE_CART.enemies)).toBe(before);
 expect(adapted.map(e=>e.x)).toEqual(ROM_MINE_CART.enemies.map(e=>e.x));
 const g=new Game();g.start(2,true);expect(g.enemies.filter(e=>e.alive)).toHaveLength(30);
 for(const x of [114.90625,412.90625]) {
  const bee=g.enemies.find(e=>e.kind==='bee'&&e.pattern!=='necky'&&e.x===x)!;
  Object.assign(g.player,{x:bee.x,y:bee.y,vy:0,grounded:false,invincible:0});g.update(emptyInput());
  expect(g.player.hp).toBe(1);expect(bee.alive).toBe(true);
  g.player.hp=2;
 }
});

it('refreshes the old bee placement in an already-open mine run',()=>{
 const g=new Game();g.start(2,true);Reflect.deleteProperty(g,'mineRecoveryLayout');
 const bee=g.enemies.find(e=>e.kind==='bee'&&e.pattern!=='necky'&&e.x===114.90625)!;
 bee.originY=1.28125;bee.y=1.28125;bee.hoverAmplitude=.6;
 const x=g.player.x;g.update(emptyInput());
 expect(bee.originY).toBe(7.53125);expect(bee.hoverAmplitude).toBe(0);
 expect(g.player.x).toBeGreaterThan(x);expect(g.lives).toBe(5);
});
