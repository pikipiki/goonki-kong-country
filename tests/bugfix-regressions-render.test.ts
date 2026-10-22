import { expect, it } from 'vitest'
import { Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three'
import { Game, emptyInput } from '../src/game/engine'
import { createOriginalGroundGeometry } from '../src/game3d/original/jungleGroundGeometry'
import { createCaveGroundGeometry } from '../src/game3d/original/caveGroundGeometry'
import { createMineCartGroundGeometry } from '../src/game3d/original/mineCartGroundGeometry'
import { createCoralGroundGeometry } from '../src/game3d/original/coralGroundGeometry'
import { ORIGINAL_JUNGLE_ORIGIN } from '../src/game/originalJungle'
import { ORIGINAL_REVERB_ORIGIN } from '../src/game/originalReverb'
import { ORIGINAL_MINE_CART_ORIGIN } from '../src/game/originalMineCart'
import { assertDefined } from './helpers/assertDefined'
for (const [stageId, origin, geometryFactory] of [
  [0, ORIGINAL_JUNGLE_ORIGIN, createOriginalGroundGeometry],
  [1, ORIGINAL_REVERB_ORIGIN, createCaveGroundGeometry],
  [2, ORIGINAL_MINE_CART_ORIGIN, createMineCartGroundGeometry],
] as const) {
  it(`renders the solid surfaces used for landing in ROM stage ${String(stageId)}`, () => {
    const game = new Game()
    game.start(stageId, true)
    let checked = 0
    for (let posX = 1.14; posX < game.level.length - 2; posX += 7) {
      const floor = game.supportAt(posX, 6, 0)
      if (floor === null) {
        continue
      }
      const geometry = geometryFactory(
        Math.floor((posX * 32 + origin.x) / 32),
        1,
      )
      const material = new MeshBasicMaterial()
      const mesh = new Mesh(geometry, material)
      mesh.updateMatrixWorld()
      const ray = new Raycaster(
        new Vector3(posX, floor + 0.1, 0),
        new Vector3(0, -1, 0),
        0,
        0.2,
      )
      const hit = ray.intersectObject(mesh)[0]
      expect(
        hit,
        `stage ${String(stageId)}, x=${String(posX)}, floor=${String(floor)}`,
      ).toBeDefined()
      expect(hit.point.y).toBeCloseTo(floor, 4)
      geometry.dispose()
      material.dispose()
      checked++
    }
    expect(checked).toBeGreaterThan(5)
  })
}
it('renders front-facing coral instead of hiding reefs by inverted normals', () => {
  const geometry = createCoralGroundGeometry(0, 16)
  const normals = geometry.getAttribute('normal')
  let front = 0
  let top = 0
  for (let index = 0; index < normals.count; index++) {
    if (normals.getZ(index) > 0.9) {
      front++
    }
    if (normals.getY(index) > 0.9) {
      top++
    }
  }
  expect(front).toBeGreaterThan(100)
  expect(top).toBeGreaterThan(100)
  geometry.dispose()
})
it('rolls barrels on the visible ROM floor without catching invisible presentation platforms', () => {
  const game = new Game()
  game.start(0, true)
  game.enemies = []
  game.animals = []
  game.thrown.push({ x: 6, y: 0.55, vx: 3, vy: 0, active: true })
  for (let index = 0; index < 25; index++) {
    game.update(emptyInput())
  }
  expect(game.thrown).toHaveLength(1)
  expect(game.thrown[0].x).toBeGreaterThan(7)
  expect(game.thrown[0].y).toBeCloseTo(0.5)
})
it('lets a dismounted land animal settle rather than remaining suspended', () => {
  const game = new Game()
  game.start(0, true)
  game.enemies = []
  const animal = game.animals[0]
  animal.state = 'idle'
  animal.x = 6
  animal.y = 3
  game.player.x = 6
  game.player.y = 0
  for (let index = 0; index < 90; index++) {
    game.update(emptyInput())
  }
  expect(animal.y).toBeCloseTo(
    assertDefined(game.supportAt(animal.x, animal.y)),
  )
  expect(animal.vy).toBe(0)
})
