import { terrainSolidSpans } from './terrainSolids'

export { mineBeePatrolBounds, mineBirdHasCloseBee } from './routeSafetyPatrol'
export { mineEncounterClearance } from './routeSafetyEncounter'
export function descendingTop(left: number, right: number) {
  return right - left
}

export function compareLandFootY(
  leftFoot: number,
  rightFoot: number,
  preferredY: number,
) {
  return (
    Math.abs(leftFoot - preferredY) - Math.abs(rightFoot - preferredY) ||
    leftFoot - rightFoot
  )
}

export interface GroundBody {
  radius: number
  height: number
}
/** Presentation adaptation: source sprite coordinates are not actor feet.
 * Find a nearby physical support with room for the imported actor's whole body.
 * Null means no grounded placement exists at this X; do not invent a floor.
 */
export function normalizeLandEnemyFeet(
  kind: string,
  worldX: number,
  preferredY: number,
  body: GroundBody,
): number | null {
  const samples = [
    worldX - body.radius,
    worldX - body.radius / 2,
    worldX,
    worldX + body.radius / 2,
    worldX + body.radius,
  ]
  const spans = samples.map((sample) => terrainSolidSpans(kind, sample))
  const candidates = [
    ...new Set(spans.flatMap((column) => column.map((span) => span.top))),
  ]
  const clear = (footY: number) =>
    spans.every((column) =>
      column.every(
        (span) =>
          footY + body.height <= span.bottom + 0.015 ||
          footY >= span.top - 0.015,
      ),
    )
  const supported = (footY: number) =>
    terrainSolidSpans(kind, worldX).some(
      (span) => span.top <= footY + 0.015 && span.top >= footY - 0.45,
    )
  return (
    candidates
      .filter((footY) => clear(footY) && supported(footY))
      .sort((left, right) => compareLandFootY(left, right, preferredY))[0] ??
    null
  )
}
/** Keep the impulse through the source counter gates and the subsequent fall.
 * This extends momentum retention only; source direction and speed are intact.
 */
export function cannonMomentumDuration(spec: {
  cannonGravityDelay?: number
  cannonControlDelay?: number
}) {
  return Math.max(
    1.6,
    (Math.max(spec.cannonGravityDelay ?? 16, spec.cannonControlDelay ?? 16) +
      1) /
      60 +
      1.2,
  )
}
