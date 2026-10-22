import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveAudioEffectId } from '../src/game/audio'
import { readSave } from '../src/game/engine'
import { cameraLayout } from '../src/game/camera'
import { cannonWorldPosition } from '../src/game/cannonMotion'
import { buildPickups, type Platform } from '../src/game/levels'
import {
  coralSourceFromWorld,
  coralWorldFromSource,
  scaleCoralLevel,
  CORAL_WORLD_SCALE,
} from '../src/game/marineScale'
import { Controls, KEYBOARD } from '../src/game/input'
import { ROM_CORAL } from '../src/game/originalCoral'
import { createAudioTestHarness } from './helpers/audioTestHarness'

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('game full coverage — audio', () => {
  it('covers audio routing branches and lifecycle edges', async () => {
    expect(resolveAudioEffectId('hurt', { character: 1 })).toBe(0x43)
    expect(resolveAudioEffectId('roll', { animal: 'rambi' })).toBe(0x56)
    expect(resolveAudioEffectId('unknown-sfx')).toBeUndefined()
    const { audio, sources } = createAudioTestHarness()
    audio.boot()
    await flush()
    audio.play('jungle')
    await flush()
    expect(audio.inspect().trackId).toBe(0)
    audio.toggle()
    audio.toggle()
    audio.effect('banana')
    await flush()
    await flush()
    for (let idx = 0; idx < 14; idx++) {
      audio.effect('banana')
    }
    await flush()
    expect(sources.length).toBeGreaterThan(0)
    audio.stop()
  })
})

describe('game full coverage — input and marine', () => {
  it('covers input helpers and gamepad polling', () => {
    expect(KEYBOARD.Space).toBe('jump')
    const controls = new Controls()
    controls.setClickMode(true)
    controls.set('kbd', 'left', true)
    controls.set('pad', 'left', true)
    controls.set('kbd', 'left', false)
    expect(controls.input.held.has('left')).toBe(true)
    controls.set('pad', 'left', false)
    expect(controls.input.released.has('left')).toBe(true)
    controls.reset()
    expect(controls.input.held.size).toBe(0)
    vi.stubGlobal('navigator', {
      getGamepads: () => [
        {
          axes: [-0.5, 0.5],
          buttons: Array.from({ length: 16 }, (_, index) => {
            const pressed =
              index === 0 || index === 1 || index === 5 || index >= 12
            if (pressed) {
              return { pressed: true }
            }
            return {}
          }),
        },
        null,
      ],
    })
    controls.gamepad()
    expect(controls.input.held.has('jump')).toBe(true)
  })

  it('covers marine scale helpers and coral level scaling', () => {
    expect(coralWorldFromSource(2)).toBe(2 * CORAL_WORLD_SCALE)
    expect(coralSourceFromWorld(3 * CORAL_WORLD_SCALE)).toBe(3)
    const scaled = scaleCoralLevel({
      ...ROM_CORAL,
      start: { x: 2, y: 3 },
      finishZone: { x: 4, y: 5, w: 6, h: 7 },
      platforms: [
        { x: 1, y: 0, w: 4, h: 2 },
        { x: 2, y: 1, w: 3, h: 2, travel: 2 },
      ],
      itemCaches: [{ x: 1, y: 2, reward: { kind: 'banana', amount: 1 } }],
      bonusRooms: [
        {
          wallIndex: 0,
          label: 'x',
          bounds: { x: 1, y: 2, w: 3, h: 4 },
          pickups: [{ x: 1, y: 2, kind: 'banana' }],
        },
      ],
    })
    expect(scaled.length).toBeGreaterThan(ROM_CORAL.length)
    expect(scaled.start.x).toBe(coralWorldFromSource(2))
  })
})

describe('game full coverage — camera and cannon', () => {
  it('covers camera layout branches', () => {
    expect(cameraLayout(400, 800).portrait).toBe(true)
    expect(cameraLayout(1200, 800).portrait).toBe(false)
    expect(cameraLayout(800, 600, true).worldWidth).toBeGreaterThan(0)
  })

  it('covers cannon motion axes and zero span', () => {
    expect(
      cannonWorldPosition(
        {
          x: 1,
          y: 2,
          kind: 'cannon',
          motion: { axis: 'y', minimum: 0, maximum: 2, speed: 1 },
        },
        0.5,
      ).y,
    ).toBeGreaterThan(2)
    expect(
      cannonWorldPosition(
        {
          x: 0,
          y: 0,
          kind: 'cannon',
          motion: {
            axis: 'x',
            minimum: 0,
            maximum: 2,
            speed: 1,
            diagonal: true,
          },
        },
        0.25,
      ).y,
    ).toBeLessThan(0)
    expect(
      cannonWorldPosition(
        {
          x: 0,
          y: 0,
          kind: 'cannon',
          motion: { axis: 'x', minimum: 0, maximum: 0, speed: 1 },
        },
        1,
      ),
    ).toEqual({ x: 0, y: 0 })
  })

  it('covers buildPickups narrow platform skip', () => {
    const platforms: Platform[] = [
      { x: 0, y: 0, w: 1, h: 4 },
      { x: 10, y: 0, w: 8, h: 4 },
    ]
    const items = buildPickups(platforms, 100, true)
    expect(items.some((item) => item.kind === 'banana')).toBe(true)
    expect(items.filter((item) => item.x < 5)).toHaveLength(0)
  })

  it('covers readSave happy path', () => {
    expect(
      readSave('{"unlocked":2,"best":{"0":{"bananas":1,"letters":2,"time":3}}}')
        .best['0'],
    ).toEqual({ bananas: 1, letters: 2, time: 3 })
    expect(readSave('{"unlocked":1.2,"best":{}}').unlocked).toBe(0)
  })
})
