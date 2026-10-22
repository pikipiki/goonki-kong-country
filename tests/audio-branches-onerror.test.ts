import { afterEach, describe, expect, it, vi } from 'vitest'
import { AudioSystem } from '../src/game/audio'

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('audio branch coverage — onError', () => {
  it('reports manifest and playback failures through onError', async () => {
    const errors: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    )
    vi.stubGlobal(
      'Audio',
      class {
        paused = true
        volume = 0
        preload = ''
        loop = false
        currentTime = 0
        play = vi.fn()
        pause() {}
        addEventListener() {}
      },
    )
    vi.stubGlobal(
      'AudioContext',
      vi.fn(function audioContextStub() {
        return {
          state: 'running',
          createGain() {
            return { gain: { value: 0.6, setTargetAtTime: vi.fn() } }
          },
          destination: {},
        }
      }),
    )
    const audio = new AudioSystem()
    audio.onError = (message) => errors.push(message)
    audio.boot()
    await flush()
    audio.play('jungle')
    await flush()
    expect(errors.length).toBeGreaterThan(0)
  })
})
