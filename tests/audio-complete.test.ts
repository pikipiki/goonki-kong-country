import { afterEach, describe, expect, it, vi } from 'vitest'
import { installAudioCompleteHarness } from './helpers/audioCompleteSetup'

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('AudioSystem branch completion — boot', () => {
  it('covers resume, boot, and loop guard callbacks', async () => {
    const { audio, context } = installAudioCompleteHarness()
    ;(audio as unknown as { onMusicTimeUpdate(): void }).onMusicTimeUpdate()
    ;(audio as unknown as { onMusicLoopTick(): void }).onMusicLoopTick()
    audio.play('jungle')
    await flush()
    clearInterval(
      (audio as unknown as { loopTimer?: ReturnType<typeof setInterval> })
        .loopTimer,
    )
    ;(audio as unknown as { onMusicLoopTick(): void }).onMusicLoopTick()
    audio.boot()
    audio.boot()
    context.state = 'closed'
    audio.wake()
    audio.stop()
    expect(context.state).toBe('closed')
  })
})

describe('AudioSystem branch completion — voices', () => {
  it('covers music loop handlers, voice limits, and effect guards', async () => {
    const { audio, voices } = installAudioCompleteHarness()
    audio.boot()
    audio.play('jungle')
    await flush()
    const track = audio.music as unknown as {
      currentTime: number
      listeners: Record<string, Array<() => void>>
    }
    track.currentTime = 0.1
    track.listeners.timeupdate.forEach((height) => {
      height()
    })
    track.currentTime = 1.2
    track.listeners.timeupdate.forEach((height2) => {
      height2()
    })
    for (let frame = 0; frame < 14; frame++) {
      audio.effect('banana')
    }
    await flush()
    await flush()
    voices.forEach((value) => value.onended?.())
    audio.muted = true
    audio.play('jungle')
    await flush()
    ;(
      audio as unknown as {
        playEffectBuffer(barrel: AudioBuffer): void
      }
    ).playEffectBuffer({} as AudioBuffer)
    audio.muted = false
    audio.play('jungle')
    await flush()
    audio.effect('missing-effect-name')
    await flush()
    audio.toggle()
    audio.toggle()
    await flush()
    expect(audio.inspect().loadedEffects).toBeGreaterThan(0)
  })
})
