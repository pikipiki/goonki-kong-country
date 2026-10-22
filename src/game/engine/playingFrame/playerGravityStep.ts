import { BUDDY_PHYSICS } from '../../animals'
import { ROM, rawSpeed, rawAcceleration } from '../romPhysics'
import type { Game } from '../gameSession'
import type { Input } from '../types'

export function applyPlayerGravity(
  game: Game,
  input: Input,
  deltaTime: number,
  cart: boolean,
  mount: Game['mount'],
) {
  const player = game.player

  if (player.cannonGravityDelay > 0) {
    player.cannonGravityDelay--
    return
  }

  let gravity = ROM.gravity

  if (cart && player.cartRebound) {
    gravity = ROM.held[0]
  } else if (
    input.held.has('jump') ||
    (game.level.biome === 'ship' && player.vy > 0)
  ) {
    if (mount) {
      gravity = BUDDY_PHYSICS.heldGravity
    } else {
      gravity = ROM.held[player.active]
    }
  }

  player.vy = Math.max(
    -rawSpeed(ROM.terminal),
    player.vy - rawAcceleration(gravity) * deltaTime,
  )
}
