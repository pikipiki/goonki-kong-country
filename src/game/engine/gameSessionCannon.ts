import { cannonWorldPosition } from '../cannonMotion'
import type { Level } from '../levels'
import { cannonLaunchVelocity } from './cannonLaunch'
import type { Game } from './gameSession'

function barrelAt(level: Level, index: number) {
  if (index < 0 || index >= level.barrels.length) {
    return undefined
  }

  return level.barrels[index]
}

export function cannonWorldAt(
  game: Game,
  index: number,
  level: Level = game.level,
) {
  const barrel = barrelAt(level, index)

  if (barrel === undefined) {
    return { x: 0, y: 0 }
  }

  let motionTime
  if (barrel.motion?.activation === 'always') {
    motionTime = game.time
  } else {
    motionTime = game.cannonTimes[index] ?? 0
  }

  return cannonWorldPosition(barrel, motionTime)
}

export function cannonAimAngle(
  game: Game,
  index: number,
  level: Level = game.level,
) {
  const barrel = barrelAt(level, index)

  if (barrel === undefined) {
    return 0.75
  }

  const aim =
    (barrel.angle ?? 0.75) +
    (barrel.rotationSpeed
      ? Math.sin(game.time * barrel.rotationSpeed) * 0.65
      : 0)

  const velocity = cannonLaunchVelocity(aim)

  return Math.atan2(velocity.vy, velocity.vx)
}
