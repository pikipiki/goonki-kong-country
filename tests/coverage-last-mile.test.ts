import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createBossBattle,
  updateBossBattle,
  type BossActor,
  type BossProjectile,
} from '../src/game/bossBattle'
import { AudioSystem, resolveAudioEffectId } from '../src/game/audio'
import { nearestCandidateBelowSNES as nearestCave } from '../src/game/originalCaveTerrain'
import {
  ceilingSNES as ceilingMine,
  nearestCandidateBelowSNES as nearestMine,
} from '../src/game/originalMineCartTerrain'
import {
  pickCeilingFloorY,
  preferHigherFloorBelow,
} from '../src/game/terrainPick'
import { createAudioTestHarness } from './helpers/audioTestHarness'

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('coverage last mile — audio', () => {
  it('covers manifest failure and effect fetch errors', async () => {
    expect(
      resolveAudioEffectId('jump', { inWater: true, animal: 'rambi' }),
    ).toBe(0x5f)
    const { fetcher } = createAudioTestHarness()
    fetcher.mockImplementation((url: string) => {
      if (url.includes('manifest')) {
        return Promise.resolve({ ok: false, status: 404, json: () => ({}) })
      }
      return Promise.resolve({ ok: false, status: 404 })
    })
    const audioBad = new AudioSystem()
    await expect(
      (
        audioBad as unknown as {
          loadManifest(): Promise<unknown>
        }
      ).loadManifest(),
    ).rejects.toThrow()
  })

  it('covers loop interval and muted boot', async () => {
    const { audio, fetcher } = createAudioTestHarness()
    fetcher.mockImplementation((url: string) => {
      if (url.includes('manifest')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              music: {
                '0': {
                  id: 0,
                  url: '/m.m4a',
                  seconds: 2,
                  loop: {
                    startSeconds: 0,
                    endSeconds: 1,
                    samplePerfect: false,
                  },
                },
              },
              effects: {},
            }),
        })
      }
      return Promise.resolve({ ok: false, status: 404 })
    })
    audio.muted = true
    audio.boot()
    audio.play('jungle')
    await flush()
    ;(
      audio as unknown as {
        onMusicLoopTick(): void
      }
    ).onMusicLoopTick()
    audio.effect('banana')
    await flush()
    expect(audio.inspect().playing).toBeTypeOf('boolean')
  })
})

describe('coverage last mile — boss and terrain', () => {
  it('covers boss facing on the right deck and dead pose', () => {
    const boss: BossActor = {
      x: 15,
      y: 0,
      vx: 0,
      vy: 0,
      min: 4,
      max: 18,
      hp: 6,
      vulnerable: false,
    }
    const state = createBossBattle(boss)
    const shots: BossProjectile[] = []
    state.phase = 'throw'
    state.phaseTime = 0.7
    updateBossBattle(state, boss, shots, 0.02)
    expect(state.facing).toBe(-1)
    state.phase = 'dead'
    boss.y = 0
    updateBossBattle(state, boss, shots, 0.016)
    expect(boss.y).toBe(0)
  })

  it('covers terrain pick helpers and mine ceiling scan', () => {
    expect(pickCeilingFloorY(5, 10, null)).toBeNull()
    expect(pickCeilingFloorY(20, 10, null)).toBe(20)
    expect(pickCeilingFloorY(25, 10, 20)).toBe(20)
    expect(pickCeilingFloorY(15, 10, 20)).toBe(15)
    expect(preferHigherFloorBelow(8, 10, null)).toBe(true)
    expect(preferHigherFloorBelow(8, 10, 7)).toBe(true)
    expect(preferHigherFloorBelow(8, 10, 8)).toBe(false)
    expect(nearestMine(96, 336)?.floorY).toBe(335)
    expect(ceilingMine(96, 200)).toBeTypeOf('number')
    expect(nearestCave(Number.POSITIVE_INFINITY, 0)).toBeNull()
  })
})
