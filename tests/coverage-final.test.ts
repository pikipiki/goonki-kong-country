import { describe, expect, it } from 'vitest'
import {
  BOSS_MAX_HITS,
  createBossBattle,
  updateBossBattle,
  type BossActor,
  type BossProjectile,
} from '../src/game/bossBattle'
import { pickPreferredOpenY } from '../src/game/terrainSolids'
import { CORAL_WATER_FLOOR_Y } from '../src/game/marineScale'
import { compareLandFootY } from '../src/game/routeSafety'

describe('extracted helpers and boss branches', () => {
  it('covers pickPreferredOpenY fallback and land-foot tie sorting', () => {
    expect(pickPreferredOpenY([], 5)).toBe(CORAL_WATER_FLOOR_Y)
    expect(compareLandFootY(2, 3, 2.5)).toBeLessThan(0)
  })

  it('throws crown from the left side and updates the dead phase', () => {
    const boss: BossActor = {
      x: 5,
      y: 0,
      vx: 0,
      vy: 0,
      min: 4,
      max: 18,
      hp: BOSS_MAX_HITS,
      vulnerable: false,
    }
    const state = createBossBattle(boss)
    const shots: BossProjectile[] = []
    state.phase = 'throw'
    state.phaseTime = 0.64
    updateBossBattle(state, boss, shots, 0.02)
    expect(state.facing).toBe(1)
    state.phase = 'dead'
    updateBossBattle(state, boss, shots, 0.016)
    expect(boss.y).toBe(0)
  })
})
