import { NECKY_NUT, NECKY_SHOOT_PERIOD, rawSpeed } from '../romPhysics'
import type { Game } from '../gameSession'
import type { Enemy } from '../types'

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
