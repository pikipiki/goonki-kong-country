import { expect, it } from 'vitest';
import { Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three';
import { terrainCellSNES as rawCell } from '../src/game/originalCaveTerrain';
import { terrainCellSNES } from '../src/game/canyonTerrain';
import { Game, emptyInput } from '../src/game/engine';
import { terrainSolidSpans } from '../src/game/terrainSolids';
import { createCaveGroundGeometry } from '../src/game3d/OriginalCaveGround';

it('removes only the suspended block after cannon 2 from collision and rendering', () => {
  const g = new Game(); g.start(1, true);
  const geometry = createCaveGroundGeometry(822, 2), material = new MeshBasicMaterial();
  const mesh = new Mesh(geometry, material); mesh.updateMatrixWorld();
  for (let px = 26304; px < 26368; px++) {
    expect(rawCell(px, 0)).not.toBeNull();
    expect(terrainCellSNES(px, 0)).toBeNull();
    const x = (px + .5 - 25472) / 32;
    expect(terrainSolidSpans('cave', x).every(s => s.top < 9)).toBe(true);
    expect(g.floorAt(x, 10)).toBeNull();
    expect(g.supportAt(x, 10, 0)).toBeLessThan(8);
    expect(new Raycaster(new Vector3(x, 10, 5), new Vector3(0, 0, -1), 0, 10).intersectObject(mesh)).toHaveLength(0);
    for (let row = 1; row < 16; row++) expect(terrainCellSNES(px, row)).toEqual(rawCell(px, row));
  }
  for (const px of [26303, 26368]) for (let row = 0; row < 16; row++)
    expect(terrainCellSNES(px, row)).toEqual(rawCell(px, row));
  geometry.dispose(); material.dispose();
});

it('lets a normal cannon shot cross the former block without stopping or losing a life', () => {
  const g = new Game(); g.start(1, true);
  const b = g.level.barrels[2];
  Object.assign(g.player, { x: b.x, y: b.y, cannon: 2, grounded: false });
  const input = emptyInput(); input.pressed.add('jump'); g.update(input);
  for (let f = 0; f < 100 && g.player.x < 29; f++) g.update(emptyInput());
  expect(g.player.x).toBeGreaterThan(28.5);
  expect(g.player.y).toBeGreaterThan(8);
  expect(g.lives).toBe(5); expect(g.player.hp).toBe(2);
});
