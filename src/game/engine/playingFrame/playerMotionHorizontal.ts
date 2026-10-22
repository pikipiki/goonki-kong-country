import { BUDDY_PHYSICS, ANIMAL_DESIGNS } from '../../animals'
import { approach, approachFootVelocity } from '../math'
import { type Game } from '../gameSession'
import { type Input } from '../types'
import { type PlayingEnv } from './playingEnv'
import { ROM_SWIM_HORIZONTAL } from '../romPhysics'
function applyMountAttackHorizontal(
  player: Game['player'],
  mount: Game['mount'],
) {
  if (mount?.kind === 'enguarde' && player.mountAttack > 0) {
    player.vx =
      player.facing * (player.mountCharged ? 18 : BUDDY_PHYSICS.stabSpeed)
    return true
  }

  if (mount?.kind === 'rambi' && player.mountAttack > 0) {
    player.vx = player.facing * (player.mountCharged ? 16 : 9)
    return true
  }

  return false
}

export function applyPlayerHorizontalMotion(
  game: Game,
  input: Input,
  deltaTime: number,
  env: PlayingEnv,
) {
  const player = game.player

  const { water, cart, swapping, chargeable } = env

  const direction =
    Number(input.held.has('right')) - Number(input.held.has('left'))

  if (direction && player.roll === 0 && player.mountAttack === 0) {
    player.facing = direction
  }

  const mount = game.mount

  const speed =
    (input.held.has('run') || input.held.has('action') ? 5.625 : 3.75) *
    (player.active ? 1.125 : 1)

  if (swapping) {
    player.vx = approach(player.vx, 0, 52 * deltaTime)
    return
  }

  if (cart) {
    player.vx = 8.5
    return
  }

  if (player.cannonControlDelay > 0) {
    return
  }

  if (player.launched > 0) {
    applyLaunchedHorizontal(player, direction, speed, deltaTime)
    return
  }

  if (!mount && !water && player.rollJumpMomentum !== 0 && !player.grounded) {
    applyRollJumpHorizontal(player, direction, speed, deltaTime)
    return
  }

  if (chargeable && player.mountCharge > 0.18 && !direction) {
    player.vx = approach(player.vx, 0, 60 * deltaTime)
    return
  }

  if (player.roll > 0) {
    player.vx = player.rollFacing * player.rollSpeed
    return
  }

  if (applyMountAttackHorizontal(player, mount)) {
    return
  }

  if (player.invincible < 1.9) {
    applyWalkHorizontal(game, input, deltaTime, direction, mount, water, speed)
  }
}

export function applyLaunchedHorizontal(
  player: Game['player'],
  direction: number,
  speed: number,
  deltaTime: number,
) {
  if (!direction) {
    return
  }

  player.vx = approach(
    player.vx,
    direction * Math.max(Math.abs(player.vx), speed),
    12 * deltaTime,
  )
}

export function applyRollJumpHorizontal(
  player: Game['player'],
  direction: number,
  speed: number,
  deltaTime: number,
) {
  if (direction === Math.sign(player.rollJumpMomentum)) {
    player.vx = player.rollJumpMomentum
    return
  }

  player.rollJumpMomentum = approach(
    player.rollJumpMomentum,
    direction * speed,
    18 * deltaTime,
  )
  player.vx = player.rollJumpMomentum

  if (Math.abs(player.rollJumpMomentum) <= speed) {
    player.rollJumpMomentum = 0
  }
}

export function horizontalAccelRate(game: Game, player: Game['player']) {
  if (game.level.biome === 'snow') {
    return 8
  }

  if (player.grounded) {
    return 38
  } else {
    return 19
  }
}

export function applyWalkHorizontal(
  game: Game,
  input: Input,
  deltaTime: number,
  direction: number,
  mount: Game['mount'],
  water: boolean,
  speed: number,
) {
  const player = game.player

  let design
  if (mount) {
    design = ANIMAL_DESIGNS[mount.kind]
  } else {
    design = undefined
  }

  let swimSpeed
  if (water && game.level.originalTerrain === 'coral') {
    swimSpeed = ROM_SWIM_HORIZONTAL
  } else {
    swimSpeed = 4.8
  }

  let targetSpeed = speed

  if (design) {
    if (input.held.has('run') || input.held.has('action')) {
      targetSpeed = design.run
    } else {
      targetSpeed = design.walk
    }
  } else if (water) {
    targetSpeed = swimSpeed
  }

  const target = direction * targetSpeed

  const rate = horizontalAccelRate(game, player) * deltaTime

  if (!mount && !water && game.level.biome !== 'snow') {
    player.vx = approachFootVelocity(player.vx, target)
  } else {
    player.vx = approach(player.vx, target, rate)
  }
}
