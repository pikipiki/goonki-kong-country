import { terrainSolidSpans } from './terrainSolidSpansCore'

export const SWIM_BODY = { radius: 0.28, height: 0.95 }
export function coralBodyBlocked(
  worldX: number,
  worldY: number,
  body = SWIM_BODY,
): boolean {
  for (const sampleX of [worldX - body.radius, worldX, worldX + body.radius]) {
    if (
      terrainSolidSpans('coral', sampleX).some(
        (span) =>
          worldY + body.height > span.bottom + 0.015 &&
          worldY < span.top - 0.015,
      )
    ) {
      return true
    }
  }
  return false
}
function axisSweep(
  from: number,
  target: number,
  blocked: (value: number) => boolean,
): number {
  const steps = Math.max(1, Math.ceil(Math.abs(target - from) / 0.04))
  let value = from
  const embedded = blocked(from)
  for (let step = 1; step <= steps; step++) {
    const next = from + ((target - from) * step) / steps
    if (!embedded && blocked(next)) {
      break
    }
    value = next
  }
  return value
}
/** Axis-separated sweeps prevent tunnelling and permit sliding along a reef.
 * Old marine probes repeated one 512px band at invisible depths; only visible
 * solid intervals may stop the swimmer. Existing overlaps can be escaped. */
export function resolveCoralMotion(
  oldX: number,
  oldY: number,
  worldX: number,
  worldY: number,
  body = SWIM_BODY,
): {
  x: number
  y: number
} {
  const nextX = axisSweep(oldX, worldX, (value) =>
    coralBodyBlocked(value, oldY, body),
  )
  const nextY = axisSweep(oldY, worldY, (value) =>
    coralBodyBlocked(nextX, value, body),
  )
  return { x: nextX, y: nextY }
}
