import { CANNON_VECTORS, rawSpeed } from './romPhysics'

export const cannonLaunchVelocity = (angleRad: number) => {
  const aimX = Math.cos(angleRad)
  const aimY = Math.sin(angleRad)
  let bestIndex = 0
  let bestDot = -Infinity
  CANNON_VECTORS.forEach((vector, index) => {
    const velocityX = rawSpeed(vector.velocityXRaw)
    const velocityY = rawSpeed(vector.velocityYRaw)
    const mag = Math.hypot(velocityX, velocityY) || 1
    const dot = (velocityX / mag) * aimX + (velocityY / mag) * aimY
    if (dot > bestDot) {
      bestDot = dot
      bestIndex = index
    }
  })
  const match = CANNON_VECTORS[bestIndex]
  return {
    vx: rawSpeed(match.velocityXRaw),
    vy: rawSpeed(match.velocityYRaw),
  }
}
