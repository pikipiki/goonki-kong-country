import { approach } from '../math'
import {
  THROW,
  NECKY_NUT,
  THROW_TARGET_VX,
  rawSpeed,
  rawAcceleration,
} from '../romPhysics'
import type { Game } from '../gameSession'
import type { Player, Thrown } from '../types'
import { cullThrownBarrel, landThrownBarrel } from './thrownBarrelLand'

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
