import {describe,it,expect} from 'vitest';
import data from '../reference/coral-terrain-v2.json';
import tables from '../reference/level-tables.json';
import {coralRomYFromWeb,coralWebYFromRom,coralTerrainCellSNES} from '../src/game/originalCoralTerrain';
import {coralBodyBlocked,resolveCoralMotion} from '../src/game/terrainSolids';
import {ENGUARDE_SWIM_BODY} from '../src/game/animals';
import {ROM_CORAL,ROM_CORAL_SOURCE} from '../src/game/originalCoral';
import {CORAL_WORLD_SCALE,CORAL_WORLD_WIDTH,CORAL_WATER_FLOOR_Y,CORAL_WATER_SURFACE_Y,coralWorldFromSource as world} from '../src/game/marineScale';
import {coralSolidSpansWorld} from '../src/game/originalCoralTerrain';
import {createCoralGroundGeometry} from '../src/game3d/OriginalCoralGround';
import {Mesh,MeshBasicMaterial,Raycaster,Vector3} from 'three';

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
 it('preserves raw 32px source evidence and uniformly expands both marine axes',()=>{
  expect(data.evidence.rowStrideBytes).toBe(128);
  expect(data.evidence.profilePointerOffset).toBe('0x1844b');
  expect(coralWebYFromRom(19632)-coralWebYFromRom(17960)).toBe((19632-17960)/32*CORAL_WORLD_SCALE);
  expect(coralRomYFromWeb(coralWebYFromRom(19488))).toBe(19488);
  expect(ROM_CORAL_SOURCE.finishZone!.y).toBe(48);
  expect(ROM_CORAL.finishZone!.y).toBe(world(48));
  expect(ROM_CORAL.length).toBe(world(ROM_CORAL_SOURCE.length));
  expect(ROM_CORAL.enemies).toHaveLength(ROM_CORAL_SOURCE.enemies.length);
  for(let i=0;i<ROM_CORAL.enemies.length;i++){
   const source=ROM_CORAL_SOURCE.enemies[i],enemy=ROM_CORAL.enemies[i];
   expect(enemy.x).toBe(world(source.x));expect(enemy.y).toBe(world(source.y));
   expect(enemy.min).toBe(world(source.min));expect(enemy.max).toBe(world(source.max));
   expect(enemy.patrolSpeed).toBe(source.patrolSpeed);
  }
  // Full map has multiple vertical rooms, not one collision strip tiled at every depth.
  expect(data.columns[13].slice(0,16)).not.toEqual(data.columns[13].slice(16,32));
 });
 for (const mounted of [false,true]) it(`has a connected swim route from entry to exit, Enguarde=${mounted}`,()=>{
  const body=mounted ? ENGUARDE_SWIM_BODY : undefined;
  const step=world(.5),queue:[[number,number]]=[[world(13),world(1)]],seen=new Set(['26,2']);let head=0,found=false;
  while(head<queue.length) {
   const [x,y]=queue[head++],zone=ROM_CORAL.finishZone!;
   if(Math.abs(x-zone.x)<zone.w/2 && y>=zone.y-.6 && y<=zone.y+zone.h){found=true;break;}
   for(const [dx,dy] of [[step,0],[-step,0],[0,step],[0,-step]]) {
    const nx=x+dx,ny=y+dy,key=`${Math.round(nx/step)},${Math.round(ny/step)}`;
    if(nx<world(.5)||nx>CORAL_WORLD_WIDTH-world(.5)||ny<CORAL_WATER_FLOOR_Y+.2||ny>CORAL_WATER_SURFACE_Y-1||seen.has(key)||coralBodyBlocked(nx,ny,body))continue;
    const motion=resolveCoralMotion(x,y,nx,ny,body);
    if(Math.abs(motion.x-nx)>.001||Math.abs(motion.y-ny)>.001)continue;
    seen.add(key);queue.push([nx,ny]);
   }
  }
  expect(found,`visited ${seen.size} open swim positions`).toBe(true);
 });
});

 it('expands reef corridors and keeps the visible mesh on the collision boundaries',()=>{
  const x=world(13.25),spans=coralSolidSpansWorld(x);
  expect(spans.length).toBeGreaterThan(1);
  const geometry=createCoralGroundGeometry(0,16),material=new MeshBasicMaterial(),mesh=new Mesh(geometry,material);
  mesh.updateMatrixWorld();
  geometry.computeBoundingBox();
  expect(geometry.boundingBox!.max.x).toBe(world(16));
  const visible=(y:number)=>new Raycaster(new Vector3(x,y,5),new Vector3(0,0,-1),0,5).intersectObject(mesh).length>0;
  for(const span of spans) expect(visible((span.bottom+span.top)/2)).toBe(true);
  const gap=spans.slice(1).map((s,i)=>({bottom:spans[i].top,top:s.bottom})).find(g=>g.top-g.bottom>world(1));
  expect(gap).toBeDefined();
  expect(visible((gap!.bottom+gap!.top)/2)).toBe(false);
  // At source x=424px the ROM floor is origin+128px, next reef starts
  // origin+448px: 320px / 32 = 10 source units becomes 15 world units.
  expect(gap!.bottom).toBe(world(128/32));
  expect(gap!.top).toBe(world(448/32));
  expect(gap!.top-gap!.bottom).toBe(15);
  geometry.dispose();material.dispose();
 });
