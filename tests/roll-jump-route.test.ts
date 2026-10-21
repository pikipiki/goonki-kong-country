import {expect,it} from 'vitest';
import {Game,emptyInput} from '../src/game/engine';

for(const active of [0,1])it(`crosses the real canyon high-branch gap with a roll jump as plush ${active}`,()=>{
 const g=new Game();g.start(1,true);g.enemies=[];g.animals=[];
 Object.assign(g.player,{active,x:90.7,y:7.5,vx:5.625,vy:0,grounded:true,recentRun:0});
 let landed=false;
 for(let f=0;f<110;f++){
  const i=emptyInput();i.held=new Set(['right','run',...(f>=18?['jump' as const]:[])]);
  if(f===0)i.pressed.add('action');if(f===18)i.pressed.add('jump');g.update(i);
  if(g.player.x>99&&g.player.y>=5.4&&g.player.grounded){landed=true;break;}
 }
 expect(landed).toBe(true);expect(g.lives).toBe(5);expect(g.player.rollJumpMomentum).toBe(0);
});

it('allows braking and reversal during a roll jump instead of forcing a direction',()=>{
 const g=new Game();g.start();g.enemies=[];g.animals=[];
 Object.assign(g.player,{x:40,y:6,vx:8,vy:0,grounded:false,rollJumpMomentum:8});
 for(let f=0;f<12;f++){const i=emptyInput();i.held.add('left');g.update(i);}
 expect(g.player.vx).toBeLessThan(5);expect(g.player.x).toBeLessThan(41.6);
});
