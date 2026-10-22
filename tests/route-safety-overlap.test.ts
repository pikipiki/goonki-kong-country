import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  descendingTop,
  mineEncounterClearance,
  normalizeLandEnemyFeet,
} from '../src/game/routeSafety'
import * as terrainSolids from '../src/game/terrainSolids'
afterEach(() => {
  vi.restoreAllMocks()
})
describe('mineEncounterClearance span overlap loops', () => {
  it('returns null when no grounded placement exists', () => {
    vi.spyOn(terrainSolids, 'terrainSolidSpans').mockReturnValue([])
    expect(
      normalizeLandEnemyFeet('mineCart', 12, 4, { radius: 0.4, height: 1.2 }),
    ).toBeNull()
  })
  const bee = (posX: number, posY: number) => ({
    x: posX,
    y: posY,
    min: posX - 2,
    max: posX + 2,
    kind: 'bee' as const,
  })
  it('raises upper clustered bees while clearing overlapping track spans', () => {
    expect(descendingTop(2, 5)).toBe(3)
    vi.spyOn(terrainSolids, 'terrainSolidSpans').mockReturnValue([
      { bottom: 0, top: 2 },
      { bottom: 3, top: 5 },
      { bottom: 4, top: 7 },
    ])
    const [lower, upper] = mineEncounterClearance([bee(20, 2), bee(22, 4.5)])
    expect(lower.y).toBeLessThan(upper.y)
    expect(upper.y).toBeGreaterThan(7.4)
    expect(upper.hoverAmplitude).toBe(0)
  })
  it('lifts close bees under a necky rebound corridor', () => {
    vi.spyOn(terrainSolids, 'terrainSolidSpans').mockImplementation(() => [
      { bottom: 0, top: 6 },
      { bottom: 7, top: 9 },
    ])
    const bird = { ...bee(10, 1), pattern: 'necky' as const }
    const cleared = mineEncounterClearance([bird, bee(15, 3)])
    expect(cleared[1].y).toBeGreaterThan(9)
    expect(cleared[1].hoverAmplitude).toBe(0)
  })
})
