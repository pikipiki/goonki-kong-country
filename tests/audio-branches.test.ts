import { afterEach, describe, expect, it, vi } from 'vitest'
import { AudioSystem } from '../src/game/audio'
const flush = () => new Promise((resolve) => setTimeout(resolve, 0))
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})
describe('audio branch coverage — hurt id', () => {
  it('resolves hurt character audio id', async () => {
    const { resolveAudioEffectId } = await import('../src/game/audio')
    expect(resolveAudioEffectId('hurt', { character: 1 })).toBe(0x43)
  })
})

describe('audio branch coverage — boot manifest failure', () => {
  it('covers boot manifest failure', async () => {
    const context = {
      state: 'running' as AudioContextState,
      currentTime: 0,
      createBufferSource: () => ({
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        onended: null as (() => void) | null,
      }),
      decodeAudioData: vi.fn(() => Promise.resolve({})),
      resume: vi.fn(),
      createGain: () => ({ gain: { value: 0.6, setTargetAtTime: vi.fn() } }),
      destination: {},
    }
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('manifest')) {
          return { ok: false, status: 500, json: () => ({}) }
        }
        return {
          ok: false,
          status: 404,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        }
      }),
    )
    vi.stubGlobal(
      'Audio',
      class {
        paused = true
        volume = 0
        preload = ''
        loop = false
        currentTime = 0
        play = vi.fn(() => {
          this.paused = false
        })
        pause() {}
        addEventListener() {}
      },
    )
    vi.stubGlobal(
      'AudioContext',
      vi.fn(function audioContextStub() {
        return context
      }),
    )
    const audio = new AudioSystem()
    audio.boot()
    await flush()
    expect(audio.inspect().loadedEffects).toBe(0)
  })
})

describe('audio branch coverage — bad effect fetch', () => {
  it('covers bad effect fetch paths', async () => {
    const context = {
      state: 'running' as AudioContextState,
      currentTime: 0,
      createBufferSource: () => ({
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        onended: null as (() => void) | null,
      }),
      decodeAudioData: vi.fn(() => Promise.resolve({})),
      resume: vi.fn(),
      createGain: () => ({ gain: { value: 0.6, setTargetAtTime: vi.fn() } }),
      destination: {},
    }
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('manifest')) {
          return {
            ok: true,
            json: () => ({
              music: {},
              effects: { '33': { id: 33, url: '/banana.m4a', seconds: 1 } },
            }),
          }
        }
        return {
          ok: false,
          status: 404,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        }
      }),
    )
    vi.stubGlobal(
      'Audio',
      class {
        paused = true
        volume = 0
        preload = ''
        loop = false
        currentTime = 0
        play = vi.fn(() => {
          this.paused = false
        })
        pause() {}
        addEventListener() {}
      },
    )
    vi.stubGlobal(
      'AudioContext',
      vi.fn(function audioContextStub() {
        return context
      }),
    )
    const audio2 = new AudioSystem()
    audio2.effect('banana')
    await flush()
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('manifest')) {
          return { ok: true, json: () => ({ music: {}, effects: {} }) }
        }
        return {
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)),
        }
      }),
    )
    const audio3 = new AudioSystem()
    audio3.effect('banana')
    await flush()
    expect(audio3.inspect().loadedEffects).toBe(0)
  })
})

describe('audio branch coverage — mute', () => {
  it('skips effects when muted and reuses in-flight downloads', async () => {
    const source = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null as (() => void) | null,
    }
    const context = {
      state: 'running' as AudioContextState,
      currentTime: 0,
      createBufferSource: () => ({ ...source }),
      decodeAudioData: vi.fn(() => Promise.resolve({})),
      resume: vi.fn(),
      createGain: () => ({ gain: { value: 0.6, setTargetAtTime: vi.fn() } }),
      destination: {},
    }
    const manifest = {
      music: { '0': { id: 0, url: '/jungle.m4a', seconds: 1, loop: null } },
      effects: { '33': { id: 33, url: '/banana.m4a', seconds: 1 } },
    }
    let fetchCount = 0
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        fetchCount++
        if (url.includes('manifest')) {
          return Promise.resolve({ ok: true, json: () => manifest })
        }
        return Promise.resolve({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)),
        })
      }),
    )
    vi.stubGlobal(
      'Audio',
      class {
        paused = true
        volume = 0
        preload = ''
        loop = false
        currentTime = 0
        play = vi.fn(() => {
          this.paused = false
        })
        pause() {
          this.paused = true
        }
        addEventListener() {}
      },
    )
    vi.stubGlobal(
      'AudioContext',
      vi.fn(function audioContextStub() {
        return context
      }),
    )
    const audio = new AudioSystem()
    audio.boot()
    audio.muted = true
    audio.effect('banana')
    await flush()
    expect(source.start).not.toHaveBeenCalled()
    audio.muted = false
    audio.play('jungle')
    await flush()
    audio.effect('banana')
    audio.effect('banana')
    await flush()
    await flush()
    expect(source.start).toHaveBeenCalled()
    expect(fetchCount).toBeLessThanOrEqual(3)
  })
})
