import { ROM, rawSpeed } from './romPhysics'
import type { Game } from './gameSession'

export function groundedJumpImpulse(
  game: Game,
  designJump: number | undefined,
) {
  if (designJump !== undefined) {
    return designJump
  }

  let scale
  if (game.level.biome === 'ship') {
    scale = 1.15
  } else {
    scale = 1
  }

  return rawSpeed(ROM.jump[game.player.active]) * scale
}
