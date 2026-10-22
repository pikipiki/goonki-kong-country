import { ANIMAL_DESIGNS } from '../../animals'
import { approach, approachFootVelocity } from '../math'
import { ROM_SWIM_HORIZONTAL } from '../romPhysics'
import type { Game } from '../gameSession'
import type { Input } from '../types'

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
