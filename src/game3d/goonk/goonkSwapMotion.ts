import type { Group } from 'three'
import type { Game } from '../../game/engine'
import { TEAM_SWAP_DURATION } from '../../game/engine'

export function applyGoonkSwapPosition(
  root: Group,
  game: Game,
  companion: boolean,
  swapU: number,
  swapHop: number,
): void {
  const player = game.player

  const swap = game.swap

  if (!swap) {
    return
  }

  if (companion) {
    const start = swap.back

    const behindX = player.x - player.facing * 1.25

    let compX: number

    let compY: number

    if (swapU < 0.5) {
      const blend = swapU * 2

      const ease = 0.5 - 0.5 * Math.cos(blend * Math.PI)

      compX = start.x + (player.x - start.x) * ease
      compY = start.y + (player.y - start.y) * ease + swapHop * 0.55
    } else {
      const blend = (swapU - 0.5) * 2

      const ease = 0.5 - 0.5 * Math.cos(blend * Math.PI)

      compX = player.x + (behindX - player.x) * ease
      compY = player.y + swapHop * 0.25 * (1 - blend)
    }

    root.position.set(compX, compY, -0.28 + swapHop * 0.15)
  } else {
    root.position.set(player.x, player.y + swapHop * 1.35, 0.3 + swapHop * 0.12)
  }
}

export function goonkSwapBlend(game: Game) {
  const swap = game.swap

  let swapU
  if (swap) {
    swapU = 1 - swap.remaining / TEAM_SWAP_DURATION
  } else {
    swapU = 0
  }

  const swapHop = Math.sin(Math.min(1, swapU) * Math.PI)

  return { swapU, swapHop, swapping: swapU > 0 && swapU < 1 }
}
