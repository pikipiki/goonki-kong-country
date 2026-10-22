import { ENEMY_DESIGNS } from '../../enemies'
import { CORAL_WATER_SURFACE_Y, CORAL_WATER_FLOOR_Y } from '../../marineScale'
import { resolveCoralMotion } from '../../terrainSolids'
import { clamp } from '../math'
import type { Game } from '../gameSession'
import type { Enemy } from '../types'

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
