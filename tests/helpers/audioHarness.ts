import { vi } from 'vitest'
import { AudioSystem } from '../../src/game/audio'
export type AudioHarness = {
  audio: AudioSystem
  context: {
    state: AudioContextState
    currentTime: number
    createBufferSource: () => {
      connect: ReturnType<typeof vi.fn>
      disconnect: ReturnType<typeof vi.fn>
      start: ReturnType<typeof vi.fn>
      stop: ReturnType<typeof vi.fn>
      onended: (() => void) | null
    }
    decodeAudioData: ReturnType<typeof vi.fn>
    resume: ReturnType<typeof vi.fn>
    createGain: () => {
      gain: {
        value: number
        setTargetAtTime: ReturnType<typeof vi.fn>
      }
    }
    destination: Record<string, never>
  }
  sources: Array<{
    onended: (() => void) | null
    disconnect: () => void
  }>
  fetcher: ReturnType<typeof vi.fn>
  Track: new () => {
    paused: boolean
    volume: number
    preload: string
    loop: boolean
    currentTime: number
    listeners: Record<string, Array<() => void>>
    play: ReturnType<typeof vi.fn>
    pause: () => void
    addEventListener: (event: string, handler: () => void) => void
  }
}
export function installAudioHarness(): AudioHarness {
  const sources: AudioHarness['sources'] = []
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
      sources.push(node)
      return node
    },
    decodeAudioData: vi.fn(() => Promise.resolve({})),
    resume: vi.fn(() => {
      context.state = 'running'
    }),
    createGain: () => ({ gain: { value: 0.6, setTargetAtTime: vi.fn() } }),
    destination: {},
  }
  class Track {
    paused = true
    volume = 0
    preload = ''
    loop = false
    currentTime = 99.6
    listeners: Record<string, Array<() => void>> = {}
    play = vi.fn(() => {
      this.paused = false
    })
    pause() {
      this.paused = true
    }
    addEventListener(event: string, handler: () => void) {
      const bucket = this.listeners[event] ?? []
      bucket.push(handler)
      this.listeners[event] = bucket
    }
  }
  const manifest = {
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
  const fetcher = vi.fn((url: string) => {
    if (url.includes('manifest')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(manifest),
      })
    }
    return Promise.resolve({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    })
  })
  vi.stubGlobal('fetch', fetcher)
  vi.stubGlobal('Audio', Track)
  vi.stubGlobal('AudioContext', function AudioContextStub() {
    return context
  })
  const audio = new AudioSystem()
  return { audio, context, sources, fetcher, Track }
}
export const flushPromises = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 0)
  })
