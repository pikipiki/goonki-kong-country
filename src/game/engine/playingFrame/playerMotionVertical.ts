import { ANIMAL_DESIGNS, BUDDY_PHYSICS } from '../../animals'
import { clamp, approach } from '../math'
import { type Game } from '../gameSession'
import { type Input } from '../types'
import { type PlayingEnv } from './playingEnv'
import {
  ROM,
  rawSpeed,
  rawAcceleration,
  JUMP_IMPULSE_DELAY_FRAMES,
  ROM_SWIM_SINK,
  ROM_SWIM_IDLE_SINK,
  ROM_SWIM_RISE,
  ROM_SWIM_DIVE,
} from '../romPhysics'
import { fireJumpAfterDelay } from '../fireJumpAfterDelay'
import { groundedJumpImpulse } from '../groundedJumpImpulse'
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

export function swimVerticalRates(coralSwim: boolean) {
  if (coralSwim) {
    return {
      sink: ROM_SWIM_SINK,
      rise: ROM_SWIM_RISE,
      dive: ROM_SWIM_DIVE,
      idleSink: ROM_SWIM_IDLE_SINK,
    }
  }

  return { sink: 7, rise: 4.3, dive: 4, idleSink: 1.2 }
}
