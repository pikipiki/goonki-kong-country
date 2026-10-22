import { BUDDY_PHYSICS } from '../../animals'
import type { Game } from '../gameSession'
import type { Input } from '../types'
import { pick } from '../../../utils/pick'

export function tryStartRoll(game: Game, input: Input, barrelNear: number) {
  const player = game.player

  if (
    !input.pressed.has('action') ||
    !player.grounded ||
    player.roll !== 0 ||
    barrelNear >= 0
  ) {
    return
  }

  player.roll = 0.48
  player.rollJump = true
  player.rollChain = 0
  player.rollAngle = 0
  player.rollFacing =
    Number(input.held.has('right')) - Number(input.held.has('left')) ||
    player.facing
  player.facing = player.rollFacing
  let base = BUDDY_PHYSICS.rollStill

  if (player.recentRun < BUDDY_PHYSICS.recentRunSeconds) {
    base = BUDDY_PHYSICS.rollRunning
  } else if (input.held.has('right') || input.held.has('left')) {
    base = BUDDY_PHYSICS.rollMoving
  }

  player.rollSpeed = base * pick(player.active, 1, 1.125)
  game.onEvent('roll')
}
