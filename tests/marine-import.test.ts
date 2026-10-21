import {describe,it,expect} from 'vitest';
import data from '../reference/coral-terrain-v2.json';
import tables from '../reference/level-tables.json';
import {coralRomYFromWeb,coralWebYFromRom,coralTerrainCellSNES} from '../src/game/originalCoralTerrain';
import {coralBodyBlocked,resolveCoralMotion} from '../src/game/terrainSolids';
import {ROM_CORAL} from '../src/game/originalCoral';

describe('Rev2 marine and environment import regressions',()=>{
 it('uses explicit attribute pointers instead of reading unused jungle sprite bytes',()=>{
  expect(tables.environmentData[1].collisionAttributePointer).toBe('$EC15F4');
  expect(tables.environmentData[9].collisionAttributePointer).toBe('$E6BE48');
  expect(data.evidence.attributeOffset).toBe('0x29c380');
  expect(data.attributes).toHaveLength(197);
 });
 it('keeps each route on the environment actually selected by its ROM entry',()=>{
  expect(tables.routeEnvironmentEvidence.BarrelCannonCanyon.environmentId).toBe(0);
  expect(tables.routeEnvironmentEvidence.MinecartMadness.environmentId).toBe(2);
  expect(tables.mineCartMetatiles.environmentId).toBe(2);
  expect(tables.canyonMetatiles.fileOffset).toBe('0x190000');
 });
 it('keeps the marine row stride and the same 32px scale as horizontal movement',()=>{
  expect(data.evidence.rowStrideBytes).toBe(128);
  expect(data.evidence.profilePointerOffset).toBe('0x1844b');
  expect(coralWebYFromRom(19632)-coralWebYFromRom(17960)).toBe((19632-17960)/32);
  expect(coralRomYFromWeb(coralWebYFromRom(19488))).toBe(19488);
  expect(ROM_CORAL.finishZone!.y).toBe(48);
  // Full map has multiple vertical rooms, not one collision strip tiled at every depth.
  expect(data.columns[13].slice(0,16)).not.toEqual(data.columns[13].slice(16,32));
 });
 it('has a connected swim route from the entry to the exit volume',()=>{
  const step=.5,queue:[[number,number]]=[[13,1]],seen=new Set(['26,2']);let head=0,found=false;
  while(head<queue.length) {
   const [x,y]=queue[head++],zone=ROM_CORAL.finishZone!;
   if(Math.abs(x-zone.x)<zone.w/2 && y>=zone.y-.6 && y<=zone.y+zone.h){found=true;break;}
   for(const [dx,dy] of [[step,0],[-step,0],[0,step],[0,-step]]) {
    const nx=x+dx,ny=y+dy,key=`${Math.round(nx*2)},${Math.round(ny*2)}`;
    if(nx<.5||nx>63.5||ny<-.5||ny>53||seen.has(key)||coralBodyBlocked(nx,ny))continue;
    const motion=resolveCoralMotion(x,y,nx,ny);
    if(Math.abs(motion.x-nx)>.001||Math.abs(motion.y-ny)>.001)continue;
    seen.add(key);queue.push([nx,ny]);
   }
  }
  expect(found,`visited ${seen.size} open swim positions`).toBe(true);
 });
});
