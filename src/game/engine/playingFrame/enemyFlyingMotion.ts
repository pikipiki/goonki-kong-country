import { ENEMY_DESIGNS } from '../../enemies'
import { CORAL_WATER_SURFACE_Y, CORAL_WATER_FLOOR_Y } from '../../marineScale'
import { resolveCoralMotion } from '../../terrainSolids'
import { clamp } from '../math'
import { type Game } from '../gameSession'
import { type Enemy } from '../types'
import { NECKY_NUT, NECKY_SHOOT_PERIOD, rawSpeed } from '../romPhysics'
export function updateFlyingEnemy(
  game: Game,
  enemy: Enemy,
  deltaTime: number,
  water: boolean,
  previousEnemyX: number,
  previousEnemyY: number,
) {
  enemy.x += enemy.vx * deltaTime
  if (enemy.x < enemy.min || enemy.x > enemy.max) {
    enemy.x = clamp(enemy.x, enemy.min, enemy.max)
    enemy.vx *= -1
  }
  enemy.y =
    enemy.originY + Math.sin(enemy.timer * 2) * (enemy.hoverAmplitude ?? 0.6)
  if (!water) {
    return
  }
  enemy.y = clamp(
    enemy.y,
    CORAL_WATER_FLOOR_Y,
    CORAL_WATER_SURFACE_Y - ENEMY_DESIGNS[enemy.kind].height * 0.5,
  )
  if (game.level.originalTerrain !== 'coral') {
    return
  }
  const contact = resolveCoralMotion(
    previousEnemyX,
    previousEnemyY,
    enemy.x,
    enemy.y,
    {
      radius: ENEMY_DESIGNS[enemy.kind].width * 0.6,
      height: ENEMY_DESIGNS[enemy.kind].height,
    },
  )
  if (Math.abs(contact.x - enemy.x) > 0.00001) {
    enemy.vx *= -1
  }
  enemy.x = contact.x
  enemy.y = contact.y
}

export function updateNeckyEnemy(game: Game, enemy: Enemy, deltaTime: number) {
  const player = game.player
  enemy.x = enemy.min
  enemy.vx = 0
  enemy.y = enemy.originY + Math.sin(enemy.timer * 1.55) * 0.42
  if (!enemy.throwsNuts) {
    return
  }
  enemy.shootCooldown -= deltaTime
  const deltaX = player.x - enemy.x
  if (
    enemy.shootCooldown > 0 ||
    Math.abs(deltaX) >= 22 ||
    Math.abs(deltaX) <= 0.6 ||
    Math.abs(player.y - enemy.y) >= 5
  ) {
    return
  }
  const toward = Math.sign(deltaX)
  game.enemyShots.push({
    x: enemy.x,
    y: enemy.y + 0.85,
    vx: toward * Math.abs(rawSpeed(NECKY_NUT.nutVxRaw)),
    vy: rawSpeed(NECKY_NUT.nutVyRaw),
    active: true,
  })
  enemy.shootCooldown = NECKY_SHOOT_PERIOD
  game.onEvent('necky-shot')
}
