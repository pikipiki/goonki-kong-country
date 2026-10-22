import type { BarrelSpec } from './levels'
import { pick } from '../utils/pick'
/** Source-driven bounded motion, including moving cannons activated on entry. */
export function cannonWorldPosition(barrel: BarrelSpec, elapsed: number) {
  const motion = barrel.motion

  if (!motion) {
    return { x: barrel.x, y: barrel.y }
  }

  const span = motion.maximum - motion.minimum

  if (span <= 0) {
    return { x: barrel.x, y: barrel.y }
  }

  const phase =
    (((-motion.minimum + elapsed * motion.speed) % (span * 2)) + span * 2) %
    (span * 2)

  let offset
  if (phase <= span) {
    offset = motion.minimum + phase
  } else {
    offset = motion.maximum - (phase - span)
  }

  let yDelta = 0

  if (motion.axis === 'y') {
    yDelta = offset
  } else if (motion.diagonal) {
    yDelta = -offset
  }

  return {
    x: barrel.x + pick(motion.axis === 'x' || motion.diagonal, offset, 0),
    y: barrel.y + yDelta,
  }
}
