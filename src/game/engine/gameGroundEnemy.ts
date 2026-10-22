import { clamp } from './math'
import { terrainSolidSpans } from '../terrainSolids'
import {
  GROUND_ENEMY_FLOOR_SNAP_EPS,
  GROUND_ENEMY_LEDGE_PROBE_X,
} from './groundEnemyMotion'
import type { Game } from './gameSession'
import type { Enemy } from './types'

export function snapEnemyToSupport(
  enemy: Enemy,
  floor: number | null,
  oldY: number,
  onGround: boolean,
) {
  if (floor === null) {
    return
  }
  if (enemy.y > floor) {
    return
  }
  if (!onGround && oldY < floor - 0.05) {
    return
  }
  enemy.y = floor
  enemy.vy = 0
}

export function groundEnemy(game: Game, enemy: Enemy, deltaTime: number) {
  const oldX = enemy.x,
    oldY = enemy.y
  const support = game.supportAt(oldX, oldY)
  const onGround =
    support !== null && Math.abs(support - oldY) < GROUND_ENEMY_FLOOR_SNAP_EPS
  const nextX = clamp(oldX + enemy.vx * deltaTime, enemy.min, enemy.max)
  const dir = Math.sign(enemy.vx)
  const probeX = nextX + dir * GROUND_ENEMY_LEDGE_PROBE_X
  const ahead = game.supportAt(probeX, oldY)
  const wall =
    game.level.originalTerrain &&
    terrainSolidSpans(game.level.originalTerrain, probeX).some(
      (span) => span.bottom < oldY + 0.65 && span.top > oldY + 0.35,
    )
  if (
    nextX === enemy.min ||
    nextX === enemy.max ||
    (onGround && (ahead === null || ahead < oldY - 0.45 || wall))
  ) {
    enemy.vx *= -1
  } else {
    enemy.x = nextX
  }
  const floor = game.supportAt(enemy.x, oldY)
  enemy.vy = Math.max(-15, enemy.vy - 30 * deltaTime)
  enemy.y += enemy.vy * deltaTime
  snapEnemyToSupport(enemy, floor, oldY, onGround)
  if (enemy.y < -8) {
    enemy.alive = false
  }
}
