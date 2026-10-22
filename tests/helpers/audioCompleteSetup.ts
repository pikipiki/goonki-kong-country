import { vi } from 'vitest'
import { AudioSystem } from '../../src/game/audio'

const completeManifest = {
  music: {
    '0': {
      id: 0,
      url: '/a.m4a',
      seconds: 2,
      loop: { startSeconds: 0, endSeconds: 1, samplePerfect: false },
    },
  },
  effects: { '33': { id: 33, url: '/b.m4a', seconds: 1 } },
}

export function installAudioCompleteHarness() {
  const voices: Array<{ onended: (() => void) | null }> = []
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
  class Track {
    paused = true
    volume = 0
    preload = ''
    loop = false
    currentTime = 0
    listeners: Record<string, Array<() => void>> = {}
    play = vi.fn(() => {
      this.paused = false
      return Promise.resolve()
    })
    pause() {
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
          json: () => Promise.resolve(completeManifest),
        })
      }
      return Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)),
      })
    }),
  )
  vi.stubGlobal('Audio', Track)
  vi.stubGlobal(
    'AudioContext',
    vi.fn(function audioContextStub() {
      return context
    }),
  )
  return { audio: new AudioSystem(), context, voices, Track }
}
