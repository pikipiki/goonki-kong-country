import {expect,it} from 'vitest';
import {Game} from '../src/game/engine';
import {Controls} from '../src/game/input';
function tick(g:Game,c:Controls,n=1) {for(let i=0;i<n;i++)g.update(c.input);}
it('carries a barrel after a screen tap, jumps with free hands, then throws on the next tap',()=>{
 const g=new Game();g.start(6);g.enemies=[];g.animals=[];g.player.x=10;
 const c=new Controls();c.set('screen-action','action',true);tick(g,c);expect(g.player.carry).toBe(1);
 c.set('screen-action','action',false);tick(g,c);expect(g.player.carry).toBe(1);expect(g.thrown).toHaveLength(0);
 c.set('screen-jump','jump',true);tick(g,c,12);expect(g.player.y).toBeGreaterThan(.2);expect(g.player.carry).toBe(1);
 c.set('screen-jump','jump',false);tick(g,c);c.set('screen-action','action',true);tick(g,c);
 expect(g.player.carry).toBe(-1);expect(g.thrown).toHaveLength(1);
});
it('keeps keyboard release-to-throw and avoids a false release from a second input source',()=>{
 const c=new Controls();c.set('keyboard-KeyX','action',true);c.input.pressed.clear();
 c.set('screen-action','action',true);c.set('screen-action','action',false);
 expect(c.input.held.has('action')).toBe(true);expect(c.input.released.has('action')).toBe(false);
 expect(c.input.tapAction).toBe(false);
 const g=new Game();g.start(6);g.enemies=[];g.animals=[];g.player.x=10;tick(g,c);expect(g.player.carry).toBe(1);
 c.set('keyboard-KeyX','action',false);tick(g,c);expect(g.player.carry).toBe(-1);expect(g.thrown).toHaveLength(1);
});
it('allows the rider to jump while a screen charge remains latched',()=>{
 const g=new Game();g.start(0);g.enemies=[];g.animals[0].state='ridden';Object.assign(g.player,{mount:0,x:12,y:0,grounded:true});
 const c=new Controls();c.set('screen-action','action',true);tick(g,c,44);expect(g.player.mountCharge).toBeGreaterThanOrEqual(.65);
 c.set('screen-jump','jump',true);tick(g,c,12);expect(g.player.y).toBeGreaterThan(.2);expect(g.player.mountCharge).toBeGreaterThanOrEqual(.65);
 c.set('screen-action','action',false);tick(g,c);expect(g.player.mountCharged).toBe(true);expect(g.player.vx).toBe(16);
});
