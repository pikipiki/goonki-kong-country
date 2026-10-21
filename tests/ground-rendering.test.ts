import { describe, expect, it } from 'vitest';
import { Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three';
import { Game } from '../src/game/engine';
import { caveGroundChunkVisible, createCaveGroundGeometry } from '../src/game3d/OriginalCaveGround';
import { mineCartGroundChunkVisible, createMineCartGroundGeometry } from '../src/game3d/OriginalMineCartGround';
import { ORIGINAL_REVERB_ORIGIN } from '../src/game/originalReverb';
import { ORIGINAL_MINE_CART_ORIGIN } from '../src/game/originalMineCart';

for (const [id, origin, visible, create] of [
  [1, ORIGINAL_REVERB_ORIGIN, caveGroundChunkVisible, createCaveGroundGeometry],
  [2, ORIGINAL_MINE_CART_ORIGIN, mineCartGroundChunkVisible, createMineCartGroundGeometry],
] as const) {
  describe(`rendered terrain with nonzero ROM origin: stage ${id}`, () => {
    it('retains every terrain chunk inside the camera window throughout the route', () => {
      const game = new Game(); game.start(id,true);
      for(let cameraX = 0; cameraX < game.level.length; cameraX += 11) {
        for(let x = Math.max(0,cameraX-12); x <= Math.min(game.level.length,cameraX+12); x+=2) {
          const firstColumn = Math.floor((x*32+origin.x)/32/16)*16;
          expect(visible(firstColumn,cameraX),`camera ${cameraX}, terrain ${x}, ROM column ${firstColumn}`).toBe(true);
        }
      }
      expect(visible(Math.floor(origin.x/32/16)*16, game.level.length+50)).toBe(false);
    });
    it('renders collision floors in visible chunks with textured surface area', () => {
      const game = new Game(); game.start(id,true); let checked = 0;
      for(let x = 1.14; x < game.level.length-2; x+=17) {
        const floor = game.supportAt(x,6,0); if(floor === null) continue;
        const column = Math.floor((x*32+origin.x)/32/16)*16;
        expect(visible(column,x)).toBe(true);
        const geometry=create(column),material=new MeshBasicMaterial(),mesh=new Mesh(geometry,material);
        mesh.updateMatrixWorld();
        const ray = new Raycaster(new Vector3(x,floor+.1,0),new Vector3(0,-1,0),0,.2);
        expect(ray.intersectObject(mesh)[0]?.point.y).toBeCloseTo(floor,4);
        const uv=geometry.getAttribute('uv'),normals=geometry.getAttribute('normal');let textured=0;
        for(let i=0;i<uv.count;i+=3) if(normals.getY(i)>.9) {
          const area=(uv.getX(i+1)-uv.getX(i))*(uv.getY(i+2)-uv.getY(i))-(uv.getX(i+2)-uv.getX(i))*(uv.getY(i+1)-uv.getY(i));
          expect(Math.abs(area)).toBeGreaterThan(0);textured++;
        }
        expect(textured).toBeGreaterThan(0);
        geometry.dispose();material.dispose();checked++;
      }
      expect(checked).toBeGreaterThan(5);
    });
  });
}

import { createOriginalGroundGeometry } from '../src/game3d/OriginalGround';
import { terrainSolidSpans } from '../src/game/terrainSolids';

it('shows empty jungle space as empty, including pits and the bonus-wall approach', () => {
  let voids=0,solids=0;
  for(const x of [4.21,14.21,58.21,61.21,65.21,100.21,106.21,108.21,110.21,111.21,115.21,147.21]) {
    const geometry=createOriginalGroundGeometry(Math.floor(x),1),material=new MeshBasicMaterial(),mesh=new Mesh(geometry,material);
    mesh.updateMatrixWorld();const spans=terrainSolidSpans('jungle',x);
    for(let y=-10.07;y<10;y+=.37) {
      // Avoid surface edges where floating-point ray intersection is ambiguous.
      if(spans.some(s=>Math.abs(y-s.top)<.02||Math.abs(y-s.bottom)<.02))continue;
      const solid=spans.some(s=>y>s.bottom&&y<s.top);
      const ray=new Raycaster(new Vector3(x,y,5),new Vector3(0,0,-1),0,9);
      const painted=ray.intersectObject(mesh).length>0;
      expect(painted,`x=${x}, y=${y}, collision solid=${solid}`).toBe(solid);
      if(solid)solids++;else voids++;
    }
    // Opaque cliff extensions and invented supports formerly occupied Z=-1.8.
    const position=geometry.getAttribute('position');
    for(let i=0;i<position.count;i++)expect(Math.abs(position.getZ(i))).toBeCloseTo(1.6,5);
    geometry.dispose();material.dispose();
  }
  expect(voids).toBeGreaterThan(300);expect(solids).toBeGreaterThan(30);
});

it('gives jungle tops texture area and exposed pit edges outward-facing side caps', () => {
  const geometry=createOriginalGroundGeometry(100,16),normal=geometry.getAttribute('normal'),uv=geometry.getAttribute('uv');
  let sides=0,tops=0;
  for(let i=0;i<normal.count;i+=3) {
    if(Math.abs(normal.getX(i))>.9)sides++;
    if(normal.getY(i)>.9) {
      const area=(uv.getX(i+1)-uv.getX(i))*(uv.getY(i+2)-uv.getY(i))-(uv.getX(i+2)-uv.getX(i))*(uv.getY(i+1)-uv.getY(i));
      expect(Math.abs(area)).toBeGreaterThan(0);tops++;
    }
  }
  expect(sides).toBeGreaterThan(20);expect(tops).toBeGreaterThan(100);geometry.dispose();
});
