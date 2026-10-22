import type { Game } from '../gameSession'
import type { Enemy } from '../types'

export function enemyHitByThrown(
  game: Game,
  enemy: Enemy,
  width: number,
  height: number,
): boolean {
  for (const barrel of game.thrown) {
    if (
      barrel.active &&
      Math.abs(barrel.x - enemy.x) < width + 0.6 &&
      Math.abs(barrel.y - enemy.y - height / 2) < height / 2 + 0.5
    ) {
      barrel.active = false
      return true
    }
  }
  return false
}
