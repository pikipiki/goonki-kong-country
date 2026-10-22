import { describe, expect, it } from 'vitest'
import {
  coralSolidSpansWorld,
  ORIGINAL_CORAL_TERRAIN,
} from '../src/game/originalCoralTerrain'
import { CORAL_PIXELS_PER_WORLD_UNIT } from '../src/game/marineScale'

describe('bounded immutable coral collision columns', () => {
  it('reuses the same source pixel without exposing mutable collision data', () => {
    const position = 401.1 / CORAL_PIXELS_PER_WORLD_UNIT
    const spans = coralSolidSpansWorld(position)
    expect(spans.length).toBeGreaterThan(0)
    expect(coralSolidSpansWorld(401.9 / CORAL_PIXELS_PER_WORLD_UNIT)).toBe(
      spans,
    )
    expect(Object.isFrozen(spans)).toBe(true)
    for (const span of spans) {
      expect(Object.isFrozen(span)).toBe(true)
      const height = span.top
      expect(Reflect.set(span, 'top', 9999)).toBe(false)
      expect(coralSolidSpansWorld(position)).toBe(spans)
      expect(span.top).toBe(height)
    }
  })
  it.each([NaN, Infinity, -Infinity, -1])(
    'keeps invalid/outside coordinates %s out of the cache',
    (position) => {
      expect(coralSolidSpansWorld(position)).toEqual([])
    },
  )
  it('stops at the source width and preserves the last visible column', () => {
    const width =
      ORIGINAL_CORAL_TERRAIN.widthPixels / CORAL_PIXELS_PER_WORLD_UNIT
    expect(coralSolidSpansWorld(width)).toEqual([])
    expect(coralSolidSpansWorld(width + 100000)).toEqual([])
    expect(Object.isFrozen(coralSolidSpansWorld(width - 0.001))).toBe(true)
  })
})
