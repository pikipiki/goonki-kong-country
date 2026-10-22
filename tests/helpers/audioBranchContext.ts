import { vi } from 'vitest'

export function stubAudioBranchContext() {
  return {
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
}

export function stubAudioContextGlobal(context: object) {
  vi.stubGlobal(
    'AudioContext',
    vi.fn(function audioContextStub() {
      return context
    }),
  )
}

export function stubSilentAudioElement() {
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
}
