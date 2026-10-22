import { CORAL_WATER_FLOOR_Y, CORAL_WATER_SURFACE_Y } from './marineScale'
import { SWIM_BODY } from './terrainCoralMotion'
import { terrainSolidSpans } from './terrainSolidSpansCore'
/** Picks the closest open swim depth, or the floor when every candidate is blocked. */
export function pickPreferredOpenY(
  candidates: number[],
  preferred: number,
): number {
  const nearest = [...candidates].sort(
    (left, right) => Math.abs(left - preferred) - Math.abs(right - preferred),
  )
  return nearest[0] ?? CORAL_WATER_FLOOR_Y
}
/** Keep imported marine actors clear of their rendered reef at spawn. Spawn
 * actors in actual open water rather than inside an intersecting reef. */
export function nearestCoralOpenY(
  worldX: number,
  preferred: number,
  height = SWIM_BODY.height,
): number {
  const blocked = (worldY: number) =>
    [worldX - SWIM_BODY.radius, worldX, worldX + SWIM_BODY.radius].some(
      (sampleX) =>
        terrainSolidSpans('coral', sampleX).some(
          (span) =>
            worldY + height > span.bottom + 0.015 && worldY < span.top - 0.015,
        ),
    )
  const candidates = [
    Math.max(CORAL_WATER_FLOOR_Y, Math.min(CORAL_WATER_SURFACE_Y, preferred)),
    CORAL_WATER_FLOOR_Y,
  ]
  for (const sampleX of [
    worldX - SWIM_BODY.radius,
    worldX,
    worldX + SWIM_BODY.radius,
  ]) {
    for (const span of terrainSolidSpans('coral', sampleX)) {
      candidates.push(span.bottom - height - 0.025, span.top + 0.025)
    }
  }
  const open = candidates.filter(
    (worldY) =>
      worldY >= CORAL_WATER_FLOOR_Y &&
      worldY <= CORAL_WATER_SURFACE_Y &&
      !blocked(worldY),
  )
  return pickPreferredOpenY(open, preferred)
}
