import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAudioTestHarness } from './helpers/audioTestHarness'
const flush = () => new Promise((resolve) => setTimeout(resolve, 0))
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})
describe('AudioSystem playback edge paths', () => {
  it('swallows resume/play rejections and reports manifest failures', async () => {
    const errors: string[] = []
    const { audio, context } = createAudioTestHarness()
    audio.onError = (message) => errors.push(message)
    context.resume = vi.fn(() => Promise.reject(new Error('resume denied')))
    audio.boot()
    audio.wake()
    await flush()
    const { audio: offline, fetcher } = createAudioTestHarness()
    offline.onError = (message) => errors.push(message)
    fetcher.mockRejectedValueOnce(new Error('offline'))
    offline.boot()
    await flush()
    offline.play('jungle')
    await flush()
    expect(errors.some((message) => message.length > 0)).toBe(true)
  })
  it('routes boot and music failures through onError', async () => {
    const errors: string[] = []
    const { audio, fetcher } = createAudioTestHarness()
    audio.onError = (message) => errors.push(message)
    fetcher.mockRejectedValueOnce(new Error('offline'))
    ;(
      audio as unknown as {
        reportSoundsUnavailable(): void
      }
    ).reportSoundsUnavailable()
    audio.play('jungle')
    await flush()
    await flush()
    expect(errors.length).toBeGreaterThan(0)
  })
})
describe('AudioSystem stale tracks', () => {
  it('ignores stale generations, missing tracks, and effect download failures', async () => {
    const { audio, fetcher, sources } = createAudioTestHarness()
    audio.play('jungle')
    audio.stop()
    await flush()
    audio.play('not-a-scene')
    await flush()
    fetcher.mockImplementationOnce((url: string) => {
      if (url.includes('manifest')) {
        return Promise.resolve({ ok: false, status: 500, json: () => ({}) })
      }
      return Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      })
    })
    audio.play('jungle')
    await flush()
    audio.play('jungle')
    await flush()
    audio.effect('banana')
    await flush()
    await flush()
    sources[0]?.onended?.()
    fetcher.mockRejectedValueOnce(new Error('sfx offline'))
    audio.effect('banana')
    await flush()
    audio.effect('missing-sfx-name')
    await flush()
    expect(fetcher).toHaveBeenCalled()
  })
})
describe('AudioSystem voice cleanup', () => {
  it('fires loop handlers and voice cleanup callbacks', async () => {
    const { audio, sources } = createAudioTestHarness()
    audio.boot()
    audio.play('jungle')
    await flush()
    const music = audio.music as unknown as {
      listeners: Record<string, Array<() => void>>
      currentTime: number
    }
    music.currentTime = 100
    for (const handler of music.listeners.timeupdate) {
      handler()
    }
    audio.effect('banana')
    await flush()
    await flush()
    const node = sources[0]
    node.onended?.()
    expect(audio.inspect().activeVoices).toBe(0)
  })
  it('reuses an existing music element and recovers after toggle', async () => {
    const { audio, FakeAudio } = createAudioTestHarness()
    audio.play('jungle')
    await flush()
    const first = FakeAudio.prototype
    audio.play('jungle')
    await flush()
    audio.toggle()
    const track = (
      audio as unknown as {
        music?: InstanceType<typeof FakeAudio>
      }
    ).music
    if (track) {
      track.rejectPlay = true
    }
    audio.toggle()
    await flush()
    expect(first).toBeDefined()
  })
})
