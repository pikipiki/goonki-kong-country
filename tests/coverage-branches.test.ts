import { describe, expect, it, vi } from 'vitest'
import {
  BOSS_MAX_HITS,
  createBossBattle,
  updateBossBattle,
  type BossActor,
  type BossProjectile,
} from '../src/game/bossBattle'
import { STEP } from '../src/game/engine'
import {
  compareLandFootY,
  mineBeePatrolBounds,
  mineEncounterClearance,
  normalizeLandEnemyFeet,
} from '../src/game/routeSafety'
import * as terrainSolids from '../src/game/terrainSolids'
function landEnemyFeetSpans(_kind: string, posX: number) {
  if (Math.abs(posX - 10) < 0.2) {
    return [{ bottom: 0, top: 2 }]
  }
  if (Math.abs(posX - 10.05) < 0.2) {
    return [{ bottom: 0, top: 3 }]
  }
  return [{ bottom: 0, top: 4 }]
}
function mineCartOverlapSpans(kind: string) {
  if (kind !== 'mineCart') {
    return []
  }
  return [
    { bottom: 0, top: 3 },
    { bottom: 2.5, top: 6 },
    { bottom: 5, top: 8 },
  ]
}
describe('boss battle branch targets', () => {
  const actor = (): BossActor => ({
    x: 5,
    y: 0,
    vx: 0,
    vy: 0,
    min: 4,
    max: 18,
    hp: BOSS_MAX_HITS,
    vulnerable: false,
  })
  it('throws toward the left when the boss stands on the right side', () => {
    const barrel = actor()
    barrel.x = 16
    const state = createBossBattle(barrel)
    const shots: BossProjectile[] = []
    state.phase = 'throw'
    state.phaseTime = 0.64
    updateBossBattle(state, barrel, shots, 0.02)
    expect(state.facing).toBe(-1)
    expect(shots.some((pickup) => pickup.kind === 'crown')).toBe(true)
  })
  it('runs left after early hits when the boss is on the left', () => {
    const barrel2 = actor()
    barrel2.x = 5
    const state2 = createBossBattle(barrel2)
    const shots: BossProjectile[] = []
    state2.phase = 'hurt'
    state2.phaseTime = 0.9
    state2.hits = 2
    updateBossBattle(state2, barrel2, shots, STEP)
    expect(state2.phase).toBe('run')
    expect(state2.facing).toBe(1)
  })
  it('keeps the dead phase stable', () => {
    const barrel3 = actor()
    const state3 = createBossBattle(barrel3)
    state3.phase = 'dead'
    updateBossBattle(state3, barrel3, [], STEP)
    expect(barrel3.y).toBe(0)
  })
})
describe('route safety branch targets', () => {
  it('exposes compareLandFootY tie-breaking', () => {
    expect(compareLandFootY(2, 3, 2.5)).toBe(-1)
  })
  it('breaks ties in normalizeLandEnemyFeet candidate sorting', () => {
    vi.spyOn(terrainSolids, 'terrainSolidSpans').mockImplementation(
      landEnemyFeetSpans,
    )
    const posY = normalizeLandEnemyFeet('mineCart', 10, 2.25, {
      radius: 0.05,
      height: 0.2,
    })
    expect(posY).toBe(2)
  })
  it('skips clustered bees without a floor span', () => {
    vi.spyOn(terrainSolids, 'terrainSolidSpans').mockReturnValue([])
    const cleared = mineEncounterClearance([
      { x: 10, y: 2, min: 8, max: 12, kind: 'bee' },
      { x: 12, y: 4, min: 8, max: 14, kind: 'bee' },
    ])
    expect(cleared[1].y).toBe(4)
  })
  it('iterates overlap resolution for upper clustered bees', () => {
    vi.spyOn(terrainSolids, 'terrainSolidSpans').mockImplementation(
      mineCartOverlapSpans,
    )
    const [lower, upper] = mineEncounterClearance([
      { x: 20, y: 2, min: 18, max: 22, kind: 'bee' },
      { x: 22, y: 4.5, min: 18, max: 24, kind: 'bee' },
    ])
    expect(upper.y).toBeGreaterThan(lower.y)
    expect(upper.hoverAmplitude).toBe(0)
  })
  it('computes patrol bounds with only left anchors', () => {
    const bounds = mineBeePatrolBounds(
      { x: 50, y: 2, min: 40, max: 60, kind: 'bee' },
      [
        { x: 10, y: 2, min: 0, max: 20, kind: 'bee' },
        { x: 50, y: 2, min: 40, max: 60, kind: 'bee' },
      ],
      200,
    )
    expect(bounds.min).toBeGreaterThan(0)
    expect(bounds.max).toBeLessThanOrEqual(200)
  })
})
