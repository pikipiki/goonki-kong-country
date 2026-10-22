import { bossArenaBounds } from '../../bossArena'
import { clamp } from '../math'
import type { Game } from '../gameSession'

export function applyBossBattleFinish(game: Game): void {
  const player = game.player
  const bounds = bossArenaBounds(game.level.length)
  const limited = clamp(player.x, bounds.playerMin, bounds.playerMax)
  if (limited !== player.x) {
    player.x = limited
    player.vx = 0
    player.rollJumpMomentum = 0
  }
  for (const shot of game.bossProjectiles) {
    if (
      shot.active &&
      shot.warning <= 0 &&
      Math.abs(player.x - shot.x) < shot.width + 0.3 &&
      player.y < shot.y + shot.height / 2 &&
      player.y + 1.35 > shot.y - shot.height / 2
    ) {
      game.damage()
    }
  }
  game.bossProjectiles = game.bossProjectiles.filter((shot) => shot.active)
}
