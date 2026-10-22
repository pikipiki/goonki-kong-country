import { BUDDY_PHYSICS } from '../../animals'
import { approach } from '../math'
import type { Game } from '../gameSession'
import type { Input } from '../types'
import type { PlayingEnv } from './playingEnv'
import { pick } from '../../../utils/pick'
import {
  applyLaunchedHorizontal,
  applyRollJumpHorizontal,
  applyWalkHorizontal,
} from './playerHorizontalModes'

function applyMountAttackHorizontal(
  player: Game['player'],
  mount: Game['mount'],
) {
  if (mount?.kind === 'enguarde' && player.mountAttack > 0) {
    player.vx =
      player.facing * pick(player.mountCharged, 18, BUDDY_PHYSICS.stabSpeed)
    return true
  }

  if (mount?.kind === 'rambi' && player.mountAttack > 0) {
    player.vx = player.facing * pick(player.mountCharged, 16, 9)
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
    pick(input.held.has('run') || input.held.has('action'), 5.625, 3.75) *
    pick(player.active, 1.125, 1)

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
