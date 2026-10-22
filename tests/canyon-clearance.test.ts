import { expect, it } from 'vitest'
import { Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three'
import { terrainCellSNES as rawCell } from '../src/game/originalCaveTerrain'
import { terrainCellSNES } from '../src/game/canyonTerrain'
import { Game, emptyInput } from '../src/game/engine'
import { terrainSolidSpans } from '../src/game/terrainSolids'
import { createCaveGroundGeometry } from '../src/game3d/original/caveGroundGeometry'
it('removes only the suspended block after cannon 2 from collision and rendering', () => {
  const game = new Game()
  game.start(1, true)
  const geometry = createCaveGroundGeometry(822, 2),
    material = new MeshBasicMaterial()
  const mesh = new Mesh(geometry, material)
  mesh.updateMatrixWorld()
  for (let pxRef = 26304; pxRef < 26368; pxRef++) {
    expect(rawCell(pxRef, 0)).not.toBeNull()
    expect(terrainCellSNES(pxRef, 0)).toBeNull()
    const posX = (pxRef + 0.5 - 25472) / 32
    expect(
      terrainSolidSpans('cave', posX).every((state) => state.top < 9),
    ).toBe(true)
    expect(game.floorAt(posX, 10)).toBeNull()
    expect(game.supportAt(posX, 10, 0)).toBeLessThan(8)
    expect(
      new Raycaster(
        new Vector3(posX, 10, 5),
        new Vector3(0, 0, -1),
        0,
        10,
      ).intersectObject(mesh),
    ).toHaveLength(0)
    for (let row = 1; row < 16; row++) {
      expect(terrainCellSNES(pxRef, row)).toEqual(rawCell(pxRef, row))
    }
  }
  for (const pxRef2 of [26303, 26368]) {
    for (let row = 0; row < 16; row++) {
      expect(terrainCellSNES(pxRef2, row)).toEqual(rawCell(pxRef2, row))
    }
  }
  geometry.dispose()
  material.dispose()
})
it('lets a normal cannon shot cross the former block without stopping or losing a life', () => {
  const game2 = new Game()
  game2.start(1, true)
  const barrel = game2.level.barrels[2]
  Object.assign(game2.player, {
    x: barrel.x,
    y: barrel.y,
    cannon: 2,
    grounded: false,
  })
  const input = emptyInput()
  input.pressed.add('jump')
  game2.update(input)
  for (let frame = 0; frame < 100 && game2.player.x < 29; frame++) {
    game2.update(emptyInput())
  }
  expect(game2.player.x).toBeGreaterThan(28.5)
  expect(game2.player.y).toBeGreaterThan(8)
  expect(game2.lives).toBe(5)
  expect(game2.player.hp).toBe(2)
})
