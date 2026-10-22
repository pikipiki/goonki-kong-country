import { approach } from '../math'
import {
  THROW,
  NECKY_NUT,
  THROW_TARGET_VX,
  rawSpeed,
  rawAcceleration,
} from '../romPhysics'
import { type Game } from '../gameSession'
import { type Player, type Thrown } from '../types'
import { bossArenaBounds, BOSS_BARREL_HEIGHT } from '../../bossArena'
import { resolveLandMotion } from '../../terrainSolids'
function stepThrownBarrel(
  game: Game,
  player: Player,
  barrel: Thrown,
  deltaTime: number,
) {
  if (!barrel.active) {
    return
  }
  const oldBarrelX = barrel.x
  const oldBarrelY = barrel.y
  const rolling = barrel.vy === 0
  const targetVx = Math.sign(barrel.vx || player.facing) * THROW_TARGET_VX
  barrel.vx = approach(
    barrel.vx,
    targetVx,
    rawSpeed(THROW.horizontalInitialMagnitudeRaw) * 2.2 * deltaTime,
  )
  barrel.x += barrel.vx * deltaTime
  barrel.y += barrel.vy * deltaTime
  barrel.vy -= 12 * deltaTime
  landThrownBarrel(game, barrel, oldBarrelX, oldBarrelY, rolling)
  cullThrownBarrel(game, barrel, player.x)
}

export function simulateThrownBarrels(
  game: Game,
  player: Player,
  deltaTime: number,
) {
  game.breakWallsWithThrown()
  game.thrown.forEach((barrel) => {
    stepThrownBarrel(game, player, barrel, deltaTime)
  })
  game.thrown = game.thrown.filter((barrel) => barrel.active)
}

export function simulateEnemyShots(
  game: Game,
  player: Player,
  deltaTime: number,
) {
  game.enemyShots.forEach((shot) => {
    if (!shot.active) {
      return
    }
    shot.x += shot.vx * deltaTime
    shot.y += shot.vy * deltaTime
    shot.vy -= rawAcceleration(NECKY_NUT.gravityRawPerFrame) * deltaTime
    if (shot.y < -8 || Math.abs(shot.x - player.x) > 35) {
      shot.active = false
    }
    for (const barrel of game.thrown) {
      if (
        Math.abs(barrel.x - shot.x) < 0.55 &&
        Math.abs(barrel.y - shot.y) < 0.55
      ) {
        shot.active = false
        barrel.active = false
      }
    }
    if (
      shot.active &&
      player.invincible <= 0 &&
      Math.abs(player.x - shot.x) < 0.55 &&
      player.y + 1.1 > shot.y &&
      player.y < shot.y + 0.45
    ) {
      shot.active = false
      game.damage()
    }
  })
  game.enemyShots = game.enemyShots.filter((shot) => shot.active)
}

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
