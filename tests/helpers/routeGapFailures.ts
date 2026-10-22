import type { Level } from '../../src/game/levels'
import { tryCrossPlatformGap } from './routeGapCrossing'

export function collectRouteGapFailures(level: Level): string[] {
  const failures: string[] = []
  if (level.biome === 'lagoon' || level.biome === 'ship') {
    return failures
  }
  const route = level.platforms
    .filter((pickup) => pickup.w >= 4)
    .sort((actor, barrel) => actor.x - barrel.x)
  for (let index = 0; index < route.length - 1; index++) {
    const from = route[index]
    const toRef = route[index + 1]
    const edge = from.x + from.w / 2
    const left = toRef.x - toRef.w / 2
    if (left <= edge) {
      continue
    }
    if (!isGapReachable(level, from, toRef, left)) {
      failures.push(
        `${String(level.id)}: ${String(from.x)} → ${String(toRef.x)} (gap ${String(left - edge)})`,
      )
    }
  }
  return failures
}

function isGapReachable(
  level: Level,
  from: Level['platforms'][number],
  toRef: Level['platforms'][number],
  left: number,
): boolean {
  for (const active of [0, 1]) {
    for (const offset of [0.12, 0.4, 0.9, 1.5]) {
      for (const startTime of [0, 1.5, 3, 4.5]) {
        if (
          tryCrossPlatformGap(
            level,
            from,
            toRef,
            left,
            active,
            offset,
            startTime,
          )
        ) {
          return true
        }
      }
    }
  }
  return false
}
