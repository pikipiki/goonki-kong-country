import { afterEach, describe, expect, it, vi } from 'vitest'
import { AudioSystem } from '../src/game/audio'

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function harness() {
  const source = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  }
  const context = {
    state: 'running' as AudioContextState,
    currentTime: 0,
    createBufferSource: () => ({ ...source }),
    decodeAudioData: vi.fn(() => Promise.resolve({})),
    resume: vi.fn(() => {
      context.state = 'running'
      return Promise.resolve()
    }),
  }
  const audioSys = new AudioSystem()
  audioSys.context = context as unknown as AudioContext
  audioSys.master = {} as GainNode
  const manifest = {
    music: {
      '0': { id: 0, url: '/jungle.m4a' },
      '16': { id: 16, url: '/bonus.m4a' },
    },
    effects: { '33': { id: 33, url: '/banana.m4a' } },
  }
  const fetcher = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(manifest),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    }),
  )
  vi.stubGlobal('fetch', fetcher)
  class FakeAudio {
    paused = true
    ended = false
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
  }
  vi.stubGlobal('Audio', FakeAudio)
  return { audioSys, context, source, fetcher }
}

describe('audio recovery across bonus scenes', () => {
  it('returns from bonus music to the jungle with live effects and resumes a suspended context', async () => {
    const { audioSys, context, source } = harness()
    audioSys.play('jungle')
    await flush()
    expect(audioSys.inspect().trackId).toBe(0)
    audioSys.play('bonus')
    await flush()
    expect(audioSys.inspect().trackId).toBe(16)
    context.state = 'suspended'
    audioSys.play('jungle')
    await flush()
    expect(context.resume).toHaveBeenCalled()
    expect(audioSys.inspect().trackId).toBe(0)
    audioSys.effect('banana')
    await flush()
    await flush()
    expect(source.start).toHaveBeenCalledOnce()
    audioSys.stop()
  })
  it('retries a failed effect download instead of caching the rejection forever', async () => {
    const { audioSys, fetcher, source } = harness()
    audioSys.play()
    await flush()
    fetcher.mockRejectedValueOnce(new Error('Temporary connection loss'))
    audioSys.effect('banana')
    await flush()
    expect(source.start).not.toHaveBeenCalled()
    audioSys.effect('banana')
    await flush()
    await flush()
    expect(source.start).toHaveBeenCalledOnce()
    audioSys.stop()
  })
  it('retries a failed manifest and respects mute while recovering', async () => {
    const { audioSys, fetcher, context, source } = harness()
    fetcher.mockRejectedValueOnce(new Error('Offline'))
    audioSys.play()
    await flush()
    audioSys.play()
    await flush()
    expect(audioSys.inspect().manifestLoaded).toBe(true)
    context.state = 'suspended'
    audioSys.muted = true
    audioSys.wake()
    audioSys.effect('banana')
    await flush()
    expect(context.resume).not.toHaveBeenCalled()
    expect(source.start).not.toHaveBeenCalled()
    audioSys.stop()
  })
})
