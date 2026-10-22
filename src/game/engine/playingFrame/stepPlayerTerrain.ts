import { ENGUARDE_SWIM_BODY } from '../../animals'
import {
  CORAL_WATER_SURFACE_Y,
  CORAL_WATER_FLOOR_Y,
  CORAL_WORLD_WIDTH,
} from '../../marineScale'
import { resolveCoralMotion, resolveLandMotion } from '../../terrainSolids'
import { clamp } from '../math'
import type { Game } from '../gameSession'
import type { Player } from '../types'

export function clampPlayerWaterSurface(game: Game, player: Player): void {
  const water = game.level.biome === 'lagoon'

  if (water && game.level.originalTerrain === 'coral') {
    if (player.y > CORAL_WATER_SURFACE_Y) {
      player.y = CORAL_WATER_SURFACE_Y
      player.vy = Math.min(0, player.vy)
    }
  } else if (water && player.y > 6) {
    player.y = 6
    player.vy = Math.min(0, player.vy)
  }
}

function resolveOriginalLandTerrain(
  game: Game,
  player: Player,
  wasGrounded: boolean,
  oldX: number,
  oldY: number,
  terrain: 'jungle' | 'cave' | 'mineCart',
): void {
  const contact = resolveLandMotion(
    terrain,
    oldX,
    oldY,
    player.x,
    player.y,
    wasGrounded,
    player.vy,
  )

  player.x = contact.x
  player.y = contact.y
  player.grounded = contact.grounded

  if (contact.blockedX) {
    player.vx = 0
    player.rollJumpMomentum = 0
    player.mountAttack = 0
    player.mountCharged = false
  }

  if (contact.blockedY) {
    player.vy = 0
  }
}

function resolveCoralTerrain(
  game: Game,
  player: Player,
  oldX: number,
  oldY: number,
): void {
  let swimBody
  if (game.player.mount >= 0) {
    swimBody = ENGUARDE_SWIM_BODY
  } else {
    swimBody = undefined
  }

  const motion = resolveCoralMotion(oldX, oldY, player.x, player.y, swimBody)

  if (Math.abs(motion.x - player.x) > 0.00001) {
    player.vx = 0
  }

  if (Math.abs(motion.y - player.y) > 0.00001) {
    player.vy = 0
  }

  player.x = clamp(motion.x, 0.3, CORAL_WORLD_WIDTH - 0.3)
  player.y = clamp(motion.y, CORAL_WATER_FLOOR_Y, CORAL_WATER_SURFACE_Y)

  if (player.y === CORAL_WATER_FLOOR_Y && player.vy < 0) {
    player.vy = 0
  }

  player.grounded = false
}

export function resolvePlayerTerrain(
  game: Game,
  player: Player,
  wasGrounded: boolean,
  oldX: number,
  oldY: number,
): boolean {
  const terrain = game.level.originalTerrain
  if (terrain && terrain !== 'coral') {
    resolveOriginalLandTerrain(game, player, wasGrounded, oldX, oldY, terrain)
    return player.grounded
  }

  if (game.level.originalTerrain === 'coral') {
    resolveCoralTerrain(game, player, oldX, oldY)
    return false
  }

  resolvePlayerPlatforms(game, player, oldX, oldY)
  return player.grounded
}

function resolvePlayerPlatforms(
  game: Game,
  player: Player,
  oldX: number,
  oldY: number,
): void {
  for (const platform of game.level.platforms) {
    const top = game.surface(platform)

    const left = platform.x - platform.w / 2

    const right = platform.x + platform.w / 2

    if (
      player.x + 0.3 > left &&
      player.x - 0.3 < right &&
      player.vy <= 0 &&
      oldY >= top - 0.18 &&
      player.y <= top
    ) {
      player.y = top
      player.vy = 0
      player.grounded = true
    } else if (
      platform.h > 2 &&
      player.y + 1.3 > top - platform.h &&
      player.y < top - 0.22
    ) {
      if (oldX + 0.3 <= left && player.x + 0.3 > left) {
        player.x = left - 0.3
        player.vx = 0
      }

      if (oldX - 0.3 >= right && player.x - 0.3 < right) {
        player.x = right + 0.3
        player.vx = 0
      }
    }
  }
}
