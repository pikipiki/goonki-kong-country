import { assertDefined } from './helpers/assertDefined'
import { describe, it, expect } from 'vitest'
import data from '../reference/coral-terrain-v2.json'
import tables from '../reference/level-tables.json'
import {
  coralRomYFromWeb,
  coralWebYFromRom,
} from '../src/game/originalCoralTerrain'
import { coralBodyBlocked, resolveCoralMotion } from '../src/game/terrainSolids'
import { ENGUARDE_SWIM_BODY } from '../src/game/animals'
import { ROM_CORAL, ROM_CORAL_SOURCE } from '../src/game/originalCoral'
import {
  CORAL_WORLD_SCALE,
  CORAL_WORLD_WIDTH,
  CORAL_WATER_FLOOR_Y,
  CORAL_WATER_SURFACE_Y,
  coralWorldFromSource as world,
} from '../src/game/marineScale'
import { coralSolidSpansWorld } from '../src/game/originalCoralTerrain'
import { createCoralGroundGeometry } from '../src/game3d/original/coralGroundGeometry'
import { Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three'

function swimRouteReachable(mounted: boolean) {
  let body
  if (mounted) {
    body = ENGUARDE_SWIM_BODY
  } else {
    body = undefined
  }
  const step = world(0.5)
  const queue: Array<[number, number]> = [[world(13), world(1)]]
  const seen = new Set(['26,2'])
  let head = 0
  let found = false
  while (head < queue.length) {
    const [posX, posY] = queue[head++]
    const zone = assertDefined(ROM_CORAL.finishZone)
    expect(zone).toBeDefined()
    if (
      Math.abs(posX - zone.x) < zone.w / 2 &&
      posY >= zone.y - 0.6 &&
      posY <= zone.y + zone.h
    ) {
      found = true
      break
    }
    for (const [deltaX, deltaY] of [
      [step, 0],
      [-step, 0],
      [0, step],
      [0, -step],
    ]) {
      const nextX = posX + deltaX
      const nextY = posY + deltaY
      const key = `${String(Math.round(nextX / step))},${String(Math.round(nextY / step))}`
      if (
        nextX < world(0.5) ||
        nextX > CORAL_WORLD_WIDTH - world(0.5) ||
        nextY < CORAL_WATER_FLOOR_Y + 0.2 ||
        nextY > CORAL_WATER_SURFACE_Y - 1 ||
        seen.has(key) ||
        coralBodyBlocked(nextX, nextY, body)
      ) {
        continue
      }
      const motion = resolveCoralMotion(posX, posY, nextX, nextY, body)
      if (
        Math.abs(motion.x - nextX) > 0.001 ||
        Math.abs(motion.y - nextY) > 0.001
      ) {
        continue
      }
      seen.add(key)
      queue.push([nextX, nextY])
    }
  }
  expect(found, `visited ${String(seen.size)} open swim positions`).toBe(true)
}

describe('Rev2 marine and environment import regressions', () => {
  it('uses explicit attribute pointers instead of reading unused jungle sprite bytes', () => {
    expect(tables.environmentData[1].collisionAttributePointer).toBe('$EC15F4')
    expect(tables.environmentData[9].collisionAttributePointer).toBe('$E6BE48')
    expect(data.evidence.attributeOffset).toBe('0x29c380')
    expect(data.attributes).toHaveLength(197)
  })
  it('keeps each route on the environment actually selected by its ROM entry', () => {
    expect(
      tables.routeEnvironmentEvidence.BarrelCannonCanyon.environmentId,
    ).toBe(0)
    expect(tables.routeEnvironmentEvidence.MinecartMadness.environmentId).toBe(
      2,
    )
    expect(tables.mineCartMetatiles.environmentId).toBe(2)
    expect(tables.canyonMetatiles.fileOffset).toBe('0x190000')
  })
  it('preserves raw 32px source evidence and uniformly expands both marine axes', () => {
    expect(data.evidence.rowStrideBytes).toBe(128)
    expect(data.evidence.profilePointerOffset).toBe('0x1844b')
    expect(coralWebYFromRom(19632) - coralWebYFromRom(17960)).toBe(
      ((19632 - 17960) / 32) * CORAL_WORLD_SCALE,
    )
    expect(coralRomYFromWeb(coralWebYFromRom(19488))).toBe(19488)
    expect(ROM_CORAL_SOURCE.finishZone?.y).toBe(48)
    expect(ROM_CORAL.finishZone?.y).toBe(world(48))
    expect(ROM_CORAL).toHaveLength(world(ROM_CORAL_SOURCE.length))
    expect(ROM_CORAL.enemies).toHaveLength(ROM_CORAL_SOURCE.enemies.length)
    for (let index = 0; index < ROM_CORAL.enemies.length; index++) {
      const source = ROM_CORAL_SOURCE.enemies[index]
      const enemy = ROM_CORAL.enemies[index]
      expect(enemy.x).toBe(world(source.x))
      expect(enemy.y).toBe(world(source.y))
      expect(enemy.min).toBe(world(source.min))
      expect(enemy.max).toBe(world(source.max))
      expect(enemy.patrolSpeed).toBe(source.patrolSpeed)
    }
    expect(data.columns[13].slice(0, 16)).not.toEqual(
      data.columns[13].slice(16, 32),
    )
  })
  for (const mounted of [false, true]) {
    it(`has a connected swim route from entry to exit, Enguarde=${String(mounted)}`, () => {
      swimRouteReachable(mounted)
    })
  }
})

it('expands reef corridors and keeps the visible mesh on the collision boundaries', () => {
  const posX = world(13.25)
  const spans = coralSolidSpansWorld(posX)
  expect(spans.length).toBeGreaterThan(1)
  const geometry = createCoralGroundGeometry(0, 16)
  const material = new MeshBasicMaterial()
  const mesh = new Mesh(geometry, material)
  mesh.updateMatrixWorld()
  geometry.computeBoundingBox()
  const bounds = geometry.boundingBox
  expect(bounds).toBeDefined()
  expect(bounds?.max.x).toBe(world(16))
  const visible = (posY: number) =>
    new Raycaster(
      new Vector3(posX, posY, 5),
      new Vector3(0, 0, -1),
      0,
      5,
    ).intersectObject(mesh).length > 0
  for (const span of spans) {
    expect(visible((span.bottom + span.top) / 2)).toBe(true)
  }
  const gap = spans
    .slice(1)
    .map((span, index) => ({ bottom: spans[index].top, top: span.bottom }))
    .find((entry) => entry.top - entry.bottom > world(1))
  expect(gap).toBeDefined()
  if (!gap) {
    return
  }
  expect(visible((gap.bottom + gap.top) / 2)).toBe(false)
  expect(gap.bottom).toBe(world(128 / 32))
  expect(gap.top).toBe(world(448 / 32))
  expect(gap.top - gap.bottom).toBe(15)
  geometry.dispose()
  material.dispose()
})
