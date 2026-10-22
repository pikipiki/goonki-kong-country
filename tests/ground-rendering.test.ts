import { describe, expect, it } from 'vitest'
import { Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three'
import { Game } from '../src/game/engine'
import { createCaveGroundGeometry } from '../src/game3d/original/caveGroundGeometry'
import { caveGroundChunkVisible } from '../src/game3d/original/caveGroundVisibility'
import { createMineCartGroundGeometry } from '../src/game3d/original/mineCartGroundGeometry'
import { mineCartGroundChunkVisible } from '../src/game3d/original/mineCartGroundVisibility'
import { ORIGINAL_REVERB_ORIGIN } from '../src/game/originalReverb'
import { ORIGINAL_MINE_CART_ORIGIN } from '../src/game/originalMineCart'
for (const [idRef, origin, visible, create] of [
  [1, ORIGINAL_REVERB_ORIGIN, caveGroundChunkVisible, createCaveGroundGeometry],
  [
    2,
    ORIGINAL_MINE_CART_ORIGIN,
    mineCartGroundChunkVisible,
    createMineCartGroundGeometry,
  ],
] as const) {
  describe(`rendered terrain with nonzero ROM origin: stage ${String(idRef)}`, () => {
    it('retains every terrain chunk inside the camera window throughout the route', () => {
      const game = new Game()
      game.start(idRef, true)
      for (let cameraX = 0; cameraX < game.level.length; cameraX += 11) {
        for (
          let posX = Math.max(0, cameraX - 12);
          posX <= Math.min(game.level.length, cameraX + 12);
          posX += 2
        ) {
          const firstColumn = Math.floor((posX * 32 + origin.x) / 32 / 16) * 16
          expect(
            visible(firstColumn, cameraX),
            `camera ${String(cameraX)}, terrain ${String(posX)}, ROM column ${String(firstColumn)}`,
          ).toBe(true)
        }
      }
      expect(
        visible(Math.floor(origin.x / 32 / 16) * 16, game.level.length + 50),
      ).toBe(false)
    })
    it('renders collision floors in visible chunks with textured surface area', () => {
      const game = new Game()
      game.start(idRef, true)
      let checked = 0
      for (let posX2 = 1.14; posX2 < game.level.length - 2; posX2 += 17) {
        const floor = game.supportAt(posX2, 6, 0)
        if (floor === null) {
          continue
        }
        const column = Math.floor((posX2 * 32 + origin.x) / 32 / 16) * 16
        expect(visible(column, posX2)).toBe(true)
        const geometry = create(column),
          material = new MeshBasicMaterial(),
          mesh = new Mesh(geometry, material)
        mesh.updateMatrixWorld()
        const ray = new Raycaster(
          new Vector3(posX2, floor + 0.1, 0),
          new Vector3(0, -1, 0),
          0,
          0.2,
        )
        expect(ray.intersectObject(mesh)[0]?.point.y).toBeCloseTo(floor, 4)
        const uvRef = geometry.getAttribute('uv'),
          normals = geometry.getAttribute('normal')
        let textured = 0
        for (let index = 0; index < uvRef.count; index += 3) {
          if (normals.getY(index) > 0.9) {
            const area =
              (uvRef.getX(index + 1) - uvRef.getX(index)) *
                (uvRef.getY(index + 2) - uvRef.getY(index)) -
              (uvRef.getX(index + 2) - uvRef.getX(index)) *
                (uvRef.getY(index + 1) - uvRef.getY(index))
            expect(Math.abs(area)).toBeGreaterThan(0)
            textured++
          }
        }
        expect(textured).toBeGreaterThan(0)
        geometry.dispose()
        material.dispose()
        checked++
      }
      expect(checked).toBeGreaterThan(5)
    })
  })
}
import { createOriginalGroundGeometry } from '../src/game3d/original/jungleGroundGeometry'
import { terrainSolidSpans } from '../src/game/terrainSolids'
it('shows empty jungle space as empty, including pits and the bonus-wall approach', () => {
  let voids = 0,
    solids = 0
  for (const posX3 of [
    4.21, 14.21, 58.21, 61.21, 65.21, 100.21, 106.21, 108.21, 110.21, 111.21,
    115.21, 147.21,
  ]) {
    const geometry = createOriginalGroundGeometry(Math.floor(posX3), 1),
      material = new MeshBasicMaterial(),
      mesh = new Mesh(geometry, material)
    mesh.updateMatrixWorld()
    const spans = terrainSolidSpans('jungle', posX3)
    for (let posY = -10.07; posY < 10; posY += 0.37) {
      // Avoid surface edges where floating-point ray intersection is ambiguous.
      if (
        spans.some(
          (state) =>
            Math.abs(posY - state.top) < 0.02 ||
            Math.abs(posY - state.bottom) < 0.02,
        )
      ) {
        continue
      }
      const solid = spans.some(
        (state2) => posY > state2.bottom && posY < state2.top,
      )
      const ray = new Raycaster(
        new Vector3(posX3, posY, 5),
        new Vector3(0, 0, -1),
        0,
        9,
      )
      const painted = ray.intersectObject(mesh).length > 0
      expect(
        painted,
        `x=${String(posX3)}, y=${String(posY)}, collision solid=${String(solid)}`,
      ).toBe(solid)
      if (solid) {
        solids++
      } else {
        voids++
      }
    }
    // Opaque cliff extensions and invented supports formerly occupied Z=-1.8.
    const position = geometry.getAttribute('position')
    for (let index2 = 0; index2 < position.count; index2++) {
      expect(Math.abs(position.getZ(index2))).toBeCloseTo(1.6, 5)
    }
    geometry.dispose()
    material.dispose()
  }
  expect(voids).toBeGreaterThan(300)
  expect(solids).toBeGreaterThan(30)
})
it('gives jungle tops texture area and exposed pit edges outward-facing side caps', () => {
  const geometry = createOriginalGroundGeometry(100, 16),
    normal = geometry.getAttribute('normal'),
    uvRef2 = geometry.getAttribute('uv')
  let sides = 0,
    tops = 0
  for (let index3 = 0; index3 < normal.count; index3 += 3) {
    if (Math.abs(normal.getX(index3)) > 0.9) {
      sides++
    }
    if (normal.getY(index3) > 0.9) {
      const area =
        (uvRef2.getX(index3 + 1) - uvRef2.getX(index3)) *
          (uvRef2.getY(index3 + 2) - uvRef2.getY(index3)) -
        (uvRef2.getX(index3 + 2) - uvRef2.getX(index3)) *
          (uvRef2.getY(index3 + 1) - uvRef2.getY(index3))
      expect(Math.abs(area)).toBeGreaterThan(0)
      tops++
    }
  }
  expect(sides).toBeGreaterThan(20)
  expect(tops).toBeGreaterThan(100)
  geometry.dispose()
})
