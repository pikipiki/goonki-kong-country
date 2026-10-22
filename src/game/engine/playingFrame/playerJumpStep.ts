import { fireJumpAfterDelay } from '../fireJumpAfterDelay'
import { groundedJumpImpulse } from '../groundedJumpImpulse'
import { JUMP_IMPULSE_DELAY_FRAMES } from '../romPhysics'
import type { Game } from '../gameSession'
import type { Input } from '../types'

export function runBufferedJump(
  game: Game,
  input: Input,
  swapping: boolean,
  jumpDesign?: number,
) {
  const player = game.player

  if (player.jumpDelay > 0) {
    player.jumpDelay--

    if (fireJumpAfterDelay(player.jumpDelay, player.coyote, player.rollJump)) {
      player.vy = groundedJumpImpulse(game, jumpDesign)
      if (player.rollJump) {
        player.rollJumpMomentum = player.vx
      } else {
        player.rollJumpMomentum = 0
      }
      player.rollJump = false
      player.roll = 0
      player.grounded = false
      player.coyote = 0
      game.onEvent('jump')
    }

    return
  }

  if (
    !swapping &&
    player.buffer > 0 &&
    (player.coyote > 0 || player.rollJump)
  ) {
    player.buffer = 0

    if (player.rollJump) {
      player.vy = groundedJumpImpulse(game, jumpDesign)
      player.rollJumpMomentum = player.vx
      player.rollJump = false
      player.roll = 0
      player.grounded = false
      player.coyote = 0
      game.onEvent('jump')
    } else {
      player.jumpDelay = JUMP_IMPULSE_DELAY_FRAMES
    }
  }
}
