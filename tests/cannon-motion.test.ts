import {expect,it} from 'vitest';
import {Game,emptyInput} from '../src/game/engine';
import {ROM_REVERB} from '../src/game/originalReverb';
import {cannonWorldPosition} from '../src/game/cannonMotion';

it('imports the occupied-only horizontal motion from the canyon triple',()=>{
 for(const i of [10,11,12]) {
  const b=ROM_REVERB.barrels[i];expect(b.motion?.speed).toBe(2.8125);
  expect(b.motion?.activation).toBe('occupied');expect(b.motion?.minimum).toBe(0);
  const max=i===10?2.625:2.875;expect(b.motion?.maximum).toBe(max);
  for(let t=0;t<20;t+=.07){const p=cannonWorldPosition(b,t);expect(p.x).toBeGreaterThanOrEqual(b.x-1e-8);expect(p.x).toBeLessThanOrEqual(b.x+max+1e-8);expect(p.y).toBe(b.y);}
 }
});
it('holds the player inside the moving cannon at its displayed world position',()=>{
 const g=new Game();g.start(1,true);g.enemies=[];g.animals=[];
 const b=g.level.barrels[11];Object.assign(g.player,{x:b.x,y:b.y,cannon:11,grounded:false});
 for(let f=0;f<60;f++)g.update(emptyInput());
 expect(g.player.cannon).toBe(11);expect(g.player.x).toBeCloseTo(b.x+2.8125,5);
 expect(g.player.x).toBe(g.cannonPosition(11).x);expect(g.player.y).toBe(g.cannonPosition(11).y);
});
it('escapes the real canyon cannon 11 by waiting for its source movement before shooting',()=>{
 const g=new Game();g.start(1,true);g.enemies=[];g.animals=[];
 const b=g.level.barrels[11];Object.assign(g.player,{x:b.x,y:b.y,cannon:11,grounded:false});
 for(let f=0;f<60;f++)g.update(emptyInput());
 const input=emptyInput();input.pressed.add('action');g.update(input);
 for(let f=0;f<24&&g.player.cannon<0;f++)g.update(emptyInput());
 expect(g.player.cannon).toBe(12);expect(g.lives).toBe(5);
});
it('moves only occupied-triggered barrels on entry, while always-moving barrels use world time',()=>{
 const g=new Game();g.start(1,true);g.enemies=[];g.animals=[];
 const still=g.cannonPosition(11);g.time=1;
 expect(g.cannonPosition(11)).toEqual(still);
 const moving=g.level.barrels.findIndex(b=>b.motion?.activation==='always');
 expect(moving).toBeGreaterThan(-1);expect(g.cannonPosition(moving)).not.toEqual({x:g.level.barrels[moving].x,y:g.level.barrels[moving].y});
});
