import { vi } from 'vitest'
import { AudioSystem } from '../../src/game/audio'

// Deliberately partial network responses let callers exercise HTTP/decoding failures.
type FixtureResponse = {
  ok: boolean
  status?: number
  json?: () => unknown
  arrayBuffer?: () => Promise<ArrayBuffer>
}

const audioTestManifest = {
  music: {
    '0': {
      id: 0,
      url: '/jungle.m4a',
      seconds: 240,
      loop: { startSeconds: 98, endSeconds: 100, samplePerfect: false },
    },
    '15': { id: 15, url: '/gameover.m4a', seconds: 1, loop: null },
  },
  effects: { '33': { id: 33, url: '/banana.m4a', seconds: 1 } },
}

export function createAudioTestHarness() {
  const sources: Array<
    AudioBufferSourceNode & {
      onended: (() => void) | null
    }
  > = []
  const source = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    onended: null as (() => void) | null,
  }
  const context = {
    state: 'suspended' as AudioContextState,
    currentTime: 0,
    createBufferSource: () => {
      const node = { ...source, onended: null as (() => void) | null }
      sources.push(
        node as unknown as AudioBufferSourceNode & {
          onended: (() => void) | null
        },
      )
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
  class FakeAudio {
    paused = true
    volume = 0
    preload = ''
    loop = false
    currentTime = 0
    listeners: Record<string, Array<() => void>> = {}
    play = vi.fn(() => {
      if (this.rejectPlay) {
        return Promise.reject(new Error('play blocked'))
      }
      this.paused = false
      return Promise.resolve()
    })
    rejectPlay = false
    pause() {
      this.paused = true
    }
    addEventListener(event: string, callback: () => void) {
      const list = this.listeners[event] ?? []
      list.push(callback)
      this.listeners[event] = list
    }
  }
  const fetcher = vi.fn((url: string): Promise<FixtureResponse> => {
    if (url.includes('manifest')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(audioTestManifest),
      })
    }
    return Promise.resolve({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    })
  })
  vi.stubGlobal('fetch', fetcher)
  vi.stubGlobal('Audio', FakeAudio)
  vi.stubGlobal(
    'AudioContext',
    vi.fn(function audioContextStub() {
      return context
    }),
  )
  const audio = new AudioSystem()
  return { audio, context, sources, fetcher, FakeAudio }
}
