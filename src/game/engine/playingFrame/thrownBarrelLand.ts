import { bossArenaBounds, BOSS_BARREL_HEIGHT } from '../../bossArena'
import { resolveLandMotion } from '../../terrainSolids'
import type { Game } from '../gameSession'
import type { Thrown } from '../types'

export function landThrownBarrel(
  game: Game,
  barrel: Thrown,
  oldBarrelX: number,
  oldBarrelY: number,
  rolling: boolean,
) {
  if (game.level.originalTerrain && game.level.originalTerrain !== 'coral') {
    const contact = resolveLandMotion(
      game.level.originalTerrain,
      oldBarrelX,
      oldBarrelY - 0.5,
      barrel.x,
      barrel.y - 0.5,
      rolling,
      barrel.vy,
      { radius: 0.45, height: 0.9 },
    )

    barrel.x = contact.x
    barrel.y = contact.y + 0.5

    if (contact.blockedY) {
      barrel.vy = 0
    }

    if (contact.blockedX) {
      barrel.active = false
    }

    return
  }

  let radius
  if (game.bossBattle) {
    radius = BOSS_BARREL_HEIGHT / 2
  } else {
    radius = 0.5
  }

  const floor = game.supportAt(barrel.x, oldBarrelY - radius, 0.2)

  if (
    floor !== null &&
    barrel.vy < 0 &&
    barrel.y <= floor + radius &&
    oldBarrelY >= floor + radius - 0.2
  ) {
    barrel.y = floor + radius
    barrel.vy = 0
  }
}

export function cullThrownBarrel(game: Game, barrel: Thrown, playerX: number) {
  if (game.bossBattle) {
    const bounds = bossArenaBounds(game.level.length)

    if (barrel.x < bounds.left || barrel.x > bounds.right) {
      barrel.active = false
      game.onEvent('barrel-break')
    }
  }

  if (barrel.y < -6 || Math.abs(barrel.x - playerX) > 30) {
    barrel.active = false
  }
}
