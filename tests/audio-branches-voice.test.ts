import { afterEach, describe, expect, it, vi } from 'vitest'
import { AudioSystem } from '../src/game/audio'
import {
  stubAudioBranchContext,
  stubAudioContextGlobal,
  stubSilentAudioElement,
} from './helpers/audioBranchContext'

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('audio branch coverage — voice cleanup', () => {
  it('reuses music elements and fires voice cleanup', async () => {
    const source = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null as (() => void) | null,
    }
    const context = stubAudioBranchContext()
    const sources: { onended: (() => void) | null }[] = []
    context.createBufferSource = () => {
      const node = { ...source, onended: null as (() => void) | null }
      sources.push(node)
      return node
    }
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('manifest')) {
          return Promise.resolve({
            ok: true,
            json: () => ({
              music: {
                '0': { id: 0, url: '/jungle.m4a', seconds: 1, loop: null },
              },
              effects: { '33': { id: 33, url: '/banana.m4a', seconds: 1 } },
            }),
          })
        }
        return Promise.resolve({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)),
        })
      }),
    )
    stubSilentAudioElement()
    stubAudioContextGlobal(context)
    const audio = new AudioSystem()
    audio.boot()
    audio.play('gameover')
    await flush()
    audio.play('jungle')
    await flush()
    audio.stop()
    audio.effect('banana')
    await flush()
    audio.boot()
    audio.wake()
    sources[0]?.onended?.()
    audio.stop()
    expect(audio.inspect().manifestLoaded).toBe(true)
  })
})
