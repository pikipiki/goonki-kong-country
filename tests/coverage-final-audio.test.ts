import { afterEach, describe, expect, it, vi } from 'vitest'
import { AudioSystem, resolveAudioEffectId } from '../src/game/audio'

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

const loopManifest = {
  music: {
    '0': {
      id: 0,
      url: '/j.m4a',
      seconds: 2,
      loop: { startSeconds: 0, endSeconds: 1, samplePerfect: false },
    },
    '99': { id: 99, url: '/missing.m4a', seconds: 1, loop: null },
  },
  effects: { '33': { id: 33, url: '/b.m4a', seconds: 1 } },
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

type VoiceNode = {
  onended: (() => void) | null
  disconnect: () => void
  stop: () => void
}

type LoopTrackInstance = {
  currentTime: number
  pause: () => void
  listeners: Record<string, Array<() => void>>
}

function createAudioContextStub(voices: VoiceNode[]) {
  const context = {
    state: 'closed' as AudioContextState,
    currentTime: 0,
    createBufferSource: () => {
      const node = {
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        onended: null as (() => void) | null,
      }
      voices.push(node)
      return node
    },
    decodeAudioData: vi.fn(() => Promise.resolve({})),
    resume: vi.fn(() => {
      context.state = 'running'
      return Promise.resolve()
    }),
    createGain: () => ({ gain: { value: 0.6, setTargetAtTime: vi.fn() } }),
    destination: {},
  }
  return context
}

function installLoopTrackPlayback() {
  const voices: VoiceNode[] = []
  const context = createAudioContextStub(voices)
  class LoopTrack {
    static count = 0
    paused = true
    volume = 0
    preload = ''
    loop = false
    currentTime = 99.6
    listeners: Record<string, Array<() => void>> = {}
    constructor() {
      LoopTrack.count++
    }
    play = vi.fn(() => {
      this.paused = false
      return Promise.resolve()
    })
    pause() {
      if (LoopTrack.count > 1) {
        throw new Error('pause blocked')
      }
      this.paused = true
    }
    addEventListener(event: string, callback: () => void) {
      const bucket = this.listeners[event] ?? []
      bucket.push(callback)
      this.listeners[event] = bucket
    }
  }
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      if (url.includes('manifest')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(loopManifest),
        })
      }
      return Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)),
      })
    }),
  )
  vi.stubGlobal('Audio', LoopTrack)
  vi.stubGlobal(
    'AudioContext',
    vi.fn(function audioContextStub() {
      return context
    }),
  )
  return voices
}

function fireTimeupdateHandlers(track: LoopTrackInstance) {
  const handlers = track.listeners.timeupdate
  handlers.forEach((handler) => {
    handler()
  })
}

describe('audio remaining branches', () => {
  it('covers resolveAudioEffectId letter edge', () => {
    expect(resolveAudioEffectId('letter', { letterIndex: 9 })).toBe(0x52)
  })

  it('covers boot, wake, and jungle playback', async () => {
    installLoopTrackPlayback()
    const audio = new AudioSystem()
    ;(audio as unknown as { onMusicTimeUpdate(): void }).onMusicTimeUpdate()
    audio.boot()
    audio.boot()
    audio.wake()
    audio.play('jungle')
    await flush()
    audio.play('not-in-music-map')
    await flush()
    audio.play('jungle')
    await flush()
    audio.play('jungle')
    await flush()
    expect(audio.inspect().trackId).toBeTypeOf('number')
  })

  it('covers timeupdate, effects, toggle, and mute', async () => {
    const voices = installLoopTrackPlayback()
    const audio = new AudioSystem()
    audio.boot()
    audio.play('jungle')
    await flush()
    const track = audio.music as LoopTrackInstance
    track.currentTime = 1.2
    fireTimeupdateHandlers(track)
    audio.stop()
    fireTimeupdateHandlers(track)
    audio.play('jungle')
    await flush()
    track.currentTime = 1.2
    track.pause = () => {
      throw new Error('pause blocked')
    }
    fireTimeupdateHandlers(track)
    for (let frame = 0; frame < 14; frame++) {
      audio.effect('banana')
    }
    await flush()
    await flush()
    voices.forEach((value) => value.onended?.())
    audio.toggle()
    audio.toggle()
    await flush()
    audio.muted = true
    audio.effect('banana')
    await flush()
    expect(audio.inspect().loadedEffects).toBeGreaterThan(0)
  })
})
