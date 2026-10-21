import {it,expect} from 'vitest';
import {Game,emptyInput} from '../src/game/engine';
import {ENGUARDE_SWIM_BODY} from '../src/game/animals';
import {CORAL_WORLD_WIDTH,CORAL_WATER_SURFACE_Y,coralWorldFromSource} from '../src/game/marineScale';
import {coralBodyBlocked,resolveCoralMotion} from '../src/game/terrainSolids';
it('can steer the mounted fish through the reef corridor up to the exit',()=>{
 const g=new Game();g.start(3,true);g.enemies=[];
 g.animals[0].state='ridden';Object.assign(g.player,{mount:0,x:coralWorldFromSource(13),y:coralWorldFromSource(1),vx:0,vy:0,invincible:0});
 const nodes=[{x:coralWorldFromSource(13),y:coralWorldFromSource(1),parent:-1}],seen=new Set([`${g.player.x*2},${g.player.y*2}`]);let head=0,goal=-1;
 const zone=g.level.finishZone!;
 while(head<nodes.length) {
  const n=nodes[head];if(Math.abs(n.x-zone.x)<zone.w/2-.25 && n.y>=zone.y+.2 && n.y<=zone.y+zone.h){goal=head;break;}
  for(const [dx,dy] of [[.5,0],[-.5,0],[0,.5],[0,-.5]]) {
   const x=n.x+dx,y=n.y+dy,key=`${Math.round(x*2)},${Math.round(y*2)}`;
   if(x<.5||x>CORAL_WORLD_WIDTH-.5||y<-.5||y>CORAL_WATER_SURFACE_Y-.5||seen.has(key)||coralBodyBlocked(x,y,ENGUARDE_SWIM_BODY))continue;
   const motion=resolveCoralMotion(n.x,n.y,x,y,ENGUARDE_SWIM_BODY);
   if(Math.abs(motion.x-x)>.001||Math.abs(motion.y-y)>.001)continue;
   seen.add(key);nodes.push({x,y,parent:head});
  }
  head++;
 }
 expect(goal).toBeGreaterThan(0);
 const route=[];for(let i=goal;i>=0;i=nodes[i].parent)route.push(nodes[i]);route.reverse();
 for(const node of route) {
  let frames=0;
  while(g.phase==='playing' && Math.hypot(g.player.x-node.x,g.player.y-node.y)>.12 && frames++<180) {
   const input=emptyInput(),dx=node.x-g.player.x,dy=node.y-g.player.y;
   if(Math.abs(dx)>.045)input.held.add(dx>0?'right':'left');
   if(Math.abs(dy)>.045)input.held.add(dy>0?'up':'down');
   g.update(input);
  }
  expect(frames,JSON.stringify({target:node,player:g.player})).toBeLessThan(180);
  if(g.phase==='clear')break;
 }
 expect(g.phase,JSON.stringify({player:g.player,goal:nodes[goal],zone})).toBe('clear');expect(g.mount?.kind).toBe('enguarde');expect(g.lives).toBe(5);
});
