import type { Game } from '../gameSession'
import { pick } from '../../../utils/pick'

export function updateCompanionTrail(game: Game, swapping: boolean): void {
  const player = game.player

  if (swapping) {
    return
  }

  game.trail.push({ x: player.x, y: player.y, facing: player.facing })

  if (game.trail.length <= 22) {
    return
  }

  const trail = game.trail.shift()

  if (!trail) {
    return
  }

  game.companion = {
    ...trail,
    x: pick(
      Math.abs(trail.x - player.x) < 1.25,
      player.x - trail.facing * 1.25,
      trail.x,
    ),
  }
}
