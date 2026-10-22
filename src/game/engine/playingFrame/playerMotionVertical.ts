import { ANIMAL_DESIGNS } from '../../animals'
import { clamp, approach } from '../math'
import type { Game } from '../gameSession'
import type { Input } from '../types'
import type { PlayingEnv } from './playingEnv'
import { applyPlayerGravity } from './playerGravityStep'
import { runBufferedJump } from './playerJumpStep'
import { swimVerticalRates } from './playerSwimRates'

function applySwimVertical(
  game: Game,
  input: Input,
  deltaTime: number,
  mount: Game['mount'],
) {
  const player = game.player

  if (mount?.kind === 'enguarde') {
    if (input.pressed.has('jump') || input.pressed.has('action')) {
      player.vy = 0
    }

    const vertical =
      Number(input.held.has('up')) - Number(input.held.has('down'))

    player.vy = approach(player.vy, vertical * 5, 24 * deltaTime)
    return
  }

  const coralSwim = game.level.originalTerrain === 'coral'

  const { sink, rise, dive, idleSink } = swimVerticalRates(coralSwim)

  if (input.held.has('down')) {
    player.vy = -dive
  } else if (input.held.has('jump') || input.held.has('up')) {
    player.vy = approach(player.vy, rise, 32 * deltaTime)

    if (coralSwim) {
      player.vy -= sink * 0.22 * deltaTime
    } else {
      player.vy -= sink * deltaTime
    }
  } else if (coralSwim) {
    player.vy = approach(player.vy, -idleSink, 16 * deltaTime)
  } else {
    player.vy -= sink * deltaTime
  }

  player.vy = clamp(player.vy, -dive, rise)
}

export function applyPlayerVerticalMotion(
  game: Game,
  input: Input,
  deltaTime: number,
  env: PlayingEnv,
) {
  const player = game.player

  if (player.cannonControlDelay > 0) {
    player.cannonControlDelay--
  }

  const mount = game.mount

  let jumpDesign
  if (mount) {
    jumpDesign = ANIMAL_DESIGNS[mount.kind].jump
  } else {
    jumpDesign = undefined
  }

  if (env.water) {
    applySwimVertical(game, input, deltaTime, mount)
    return
  }

  runBufferedJump(game, input, env.swapping, jumpDesign)
  applyPlayerGravity(game, input, deltaTime, env.cart, mount)

  if (
    mount?.kind === 'expresso' &&
    !player.grounded &&
    player.vy < 0 &&
    input.held.has('jump')
  ) {
    player.vy = Math.max(player.vy, -0.65)
  }
}
