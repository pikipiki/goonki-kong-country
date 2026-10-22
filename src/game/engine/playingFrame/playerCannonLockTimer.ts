import type { Game } from '../gameSession'

export function tickPlayerCannonLock(game: Game) {
  const player = game.player

  if (player.cannonLock < 0) {
    return
  }

  const barrel = game.level.barrels.at(player.cannonLock)

  const source = barrel ? game.cannonPosition(player.cannonLock) : null

  if (!source || Math.hypot(player.x - source.x, player.y - source.y) > 1.7) {
    player.cannonLock = -1
  }
}
