import { ORIGINAL_JUNGLE_ORIGIN } from '../originalJungle'
import { ORIGINAL_CORAL_ORIGIN } from '../originalCoral'
import { ORIGINAL_REVERB_ORIGIN } from '../originalReverb'
import { ORIGINAL_MINE_CART_ORIGIN } from '../originalMineCart'
import { query as originalTerrain } from '../originalTerrain'
import { query as originalCaveTerrain } from '../canyonTerrain'
import { query as originalMineCartTerrain } from '../originalMineCartTerrain'
import { queryCoral } from '../originalCoralTerrain'
import { terrainSolidSpans } from '../terrainSolids'
import type { Platform } from '../levels'
import { SNES_HORIZONTAL_WALL_PROBE_FOOT_LIFT } from '../snesHorizontalTerrainCell'
import type { Game } from './gameSession'

export function surfacePlatform(game: Game, platform: Platform) {
  if (platform.kind !== 'moving') {
    return platform.y
  }

  let travel
  if (platform.travel === undefined) {
    travel = 1.5
  } else {
    travel = platform.travel
  }

  return platform.y + Math.sin(game.time * 1.1 + platform.x) * travel
}

export function floorAtWorld(game: Game, worldX: number, worldY: number) {
  if (game.level.originalTerrain === 'jungle') {
    return (
      originalTerrain(worldX, worldY, ORIGINAL_JUNGLE_ORIGIN)?.floorY ?? null
    )
  }

  if (game.level.originalTerrain === 'cave') {
    return (
      originalCaveTerrain(worldX, worldY, ORIGINAL_REVERB_ORIGIN)?.floorY ??
      null
    )
  }

  if (game.level.originalTerrain === 'mineCart') {
    return (
      originalMineCartTerrain(worldX, worldY, ORIGINAL_MINE_CART_ORIGIN)
        ?.floorY ?? null
    )
  }

  if (game.level.originalTerrain === 'coral') {
    return queryCoral(worldX, worldY, ORIGINAL_CORAL_ORIGIN)?.floorY ?? null
  }

  let top: number | null = null

  for (const platform of game.level.platforms) {
    const floor = surfacePlatform(game, platform)

    if (
      Math.abs(worldX - platform.x) < platform.w / 2 &&
      floor <= worldY + SNES_HORIZONTAL_WALL_PROBE_FOOT_LIFT &&
      (top === null || floor > top)
    ) {
      top = floor
    }
  }

  return top
}

export function supportAtFeet(
  game: Game,
  posX: number,
  feet: number,
  rise = 0.3,
) {
  let highest: number | null = null
  const maxSupportY = feet + rise
  if (game.level.originalTerrain) {
    for (const span of terrainSolidSpans(game.level.originalTerrain, posX)) {
      if (span.top <= maxSupportY)
        highest = Math.max(highest ?? -Infinity, span.top)
    }
  } else {
    for (const platform of game.level.platforms) {
      if (Math.abs(posX - platform.x) >= platform.w / 2) continue
      const surfaceY = surfacePlatform(game, platform)
      if (surfaceY <= maxSupportY)
        highest = Math.max(highest ?? -Infinity, surfaceY)
    }
  }
  return highest
}
