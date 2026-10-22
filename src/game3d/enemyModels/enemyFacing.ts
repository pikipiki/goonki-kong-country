import type { Enemy } from '../../game/engine'

export function enemyBodyYaw(enemy: Enemy): number {
  if (enemy.kind === 'boss') {
    const facing = enemy.bossFacing ?? -1
    if (facing < 0) {
      return Math.PI - 0.18
    }
    return 0.18
  }
  if (enemy.vx < 0) {
    return Math.PI - 0.18
  }
  return 0.18
}

export function enemyBobOffset(enemy: Enemy, tick: number): number {
  if (enemy.kind === 'bee') {
    return Math.sin(tick * 10) * 0.035
  }
  return Math.abs(Math.sin(tick * 7)) * 0.018
}
