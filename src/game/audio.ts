/** Audio captured from the user's identified Rev 2 ROM through its real SPC driver.
 * Asset provenance and imperfect loop-boundary limits live in /audio/manifest.json.
 * Music streams through HTMLAudio to avoid decoding minutes of PCM into mobile RAM.
 */
import { tr } from '../i18n'
import { localeKeys } from '../i18n/keys'
import {
  resolveAudioEffectId,
  type AudioEffectContext,
} from './audioEffectRouting'

export {
  resolveAudioEffectId,
  type AudioEffectContext,
} from './audioEffectRouting'

import {
  AUDIO_MUSIC_IDS as MUSIC,
  AUDIO_ONCE_EFFECT_IDS as ONCE,
  type AudioEffect as Effect,
  type AudioManifest as Manifest,
  type AudioMusic as Music,
} from './audioMusicIds'
import { audioInspectSnapshot } from './audioInspect'
import { resolveViteAssetPath } from '../lib/viteAssetPath'

export class AudioSystem {
  context?: AudioContext
  muted = false
  master?: GainNode
  music?: HTMLAudioElement
  manifest?: Manifest
  private manifestPromise?: Promise<Manifest>
  private buffers = new Map<number, AudioBuffer>()
  private loading = new Map<number, Promise<AudioBuffer>>()
  private voices = new Set<AudioBufferSourceNode>()
  private currentId = -1
  private desiredId = -1
  private generation = 0
  private active = false
  private loopTimer?: ReturnType<typeof setInterval>
  private loopEntry?: Music
  onError: (message: string) => void = () => {}
  private swallowPlaybackError(): void {
    /* ignored autoplay / policy errors */
  }
  private reportSoundsUnavailable(): void {
    this.onError(tr(localeKeys.audio.soundsUnavailable))
  }
  private reportMusicLoadFailed(): void {
    this.onError(tr(localeKeys.audio.musicLoadFailed))
  }
  private onMusicTimeUpdate = (): void => {
    if (this.loopEntry) {
      this.applyLoop(this.loopEntry)
    }
  }
  private onMusicLoopTick = (): void => {
    if (this.loopEntry) {
      this.applyLoop(this.loopEntry)
    }
  }
  private playElement(element?: HTMLAudioElement): void {
    element?.play().catch(() => {
      this.swallowPlaybackError()
    })
  }
  private resumeContextIfNeeded(): void {
    if (
      !this.context ||
      this.context.state === 'running' ||
      this.context.state === 'closed'
    ) {
      return
    }

    void this.context.resume().catch(() => {
      this.swallowPlaybackError()
    })
  }
  private parseManifestResponse(response: Response): Promise<Manifest> {
    if (!response.ok) {
      throw new Error('Audio manifest unavailable')
    }

    return response.json() as Promise<Manifest>
  }
  private rememberManifest(manifest: Manifest): Manifest {
    this.manifest = manifest
    return manifest
  }
  private resetManifestPromise(error: unknown): never {
    this.manifestPromise = undefined
    throw error
  }
  private loadManifest() {
    this.manifestPromise ??= fetch(
      `${import.meta.env.BASE_URL}audio/manifest.json`,
    )
      .then((response) => this.parseManifestResponse(response))
      .then((manifest) => this.rememberManifest(manifest))
      .catch((error: unknown) => this.resetManifestPromise(error))
    return this.manifestPromise
  }
  boot() {
    try {
      this.context ??= new AudioContext()

      if (!this.master) {
        this.master = this.context.createGain()
        this.master.gain.value = this.muted ? 0 : 0.6
        this.master.connect(this.context.destination)
      }

      this.wake()
      void this.loadManifest().catch(() => {
        this.reportSoundsUnavailable()
      })

      if (this.active && this.music && !this.muted) {
        this.playElement(this.music)
      }
    } catch {
      /* A browser without audio still permits playing. */
    }
  }
  /** Call on real input too: mobile browsers may suspend effects independently
   * of the streamed music after an interruption or a scene change. */
  wake() {
    if (this.muted) {
      return
    }

    this.resumeContextIfNeeded()

    if (this.active && this.music?.paused) {
      this.playElement(this.music)
    }
  }
  private beginMusic(entry: Music, generation: number): void {
    if (generation !== this.generation || !this.active) {
      return
    }

    if (this.currentId !== entry.id || !this.music) {
      this.music?.pause()
      this.currentId = entry.id
      this.music = new Audio(resolveViteAssetPath(entry.url))
      this.music.preload = 'auto'
      this.music.loop = !entry.loop && !ONCE.has(entry.id)
      this.music.addEventListener('timeupdate', this.onMusicTimeUpdate)
    }

    this.loopEntry = entry
    this.music.volume = this.muted ? 0 : 0.48

    if (!this.muted) {
      this.playElement(this.music)
    }

    clearInterval(this.loopTimer)
    this.loopTimer = setInterval(this.onMusicLoopTick, 30)
  }
  play(scene = 'jungle') {
    this.active = true
    this.wake()
    this.desiredId = MUSIC[scene] ?? 0
    const generation = ++this.generation

    void this.loadManifest()
      .then((manifest) => {
        const musicKey = String(this.desiredId)

        if (!(musicKey in manifest.music)) {
          return
        }

        this.beginMusic(manifest.music[musicKey], generation)
      })
      .catch(() => {
        this.reportMusicLoadFailed()
      })
  }
  private applyLoop(entry: Music) {
    if (
      !this.music ||
      this.currentId !== entry.id ||
      !entry.loop ||
      !this.active
    ) {
      return
    }

    const { startSeconds, endSeconds } = entry.loop

    const currentTime = this.music.currentTime

    if (currentTime < endSeconds - 0.05) {
      return
    }

    const overshoot = Math.min(Math.max(0, currentTime - endSeconds), 0.06)

    try {
      this.music.pause()
      this.music.currentTime = startSeconds + overshoot

      if (!this.muted) {
        this.playElement(this.music)
      }
    } catch {
      this.music.currentTime = startSeconds
    }
  }
  stop() {
    this.active = false
    this.generation++
    this.music?.pause()
    clearInterval(this.loopTimer)
  }
  private async loadEffectBuffer(
    effectId: number,
    entry: Effect,
  ): Promise<AudioBuffer> {
    let pending = this.loading.get(effectId)

    if (!pending) {
      const audioContext = this.context

      if (!audioContext) {
        throw new Error('Audio context unavailable')
      }

      pending = fetch(resolveViteAssetPath(entry.url))
        .then((response) => {
          if (!response.ok) {
            throw new Error('Missing effect')
          }

          return response.arrayBuffer()
        })
        .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
      this.loading.set(effectId, pending)
    }

    try {
      const buffer = await pending

      this.buffers.set(effectId, buffer)
      return buffer
    } finally {
      if (this.loading.get(effectId) === pending) {
        this.loading.delete(effectId)
      }
    }
  }
  private playEffectBuffer(buffer: AudioBuffer): void {
    if (this.muted || !this.active || !this.context || !this.master) {
      return
    }

    if (this.voices.size >= 12) {
      const oldest = this.voices.values().next().value

      oldest?.stop()
    }

    const source = this.context.createBufferSource()

    source.buffer = buffer
    source.connect(this.master)
    this.voices.add(source)
    source.onended = () => {
      this.voices.delete(source)
      source.disconnect()
    }

    source.start()
  }
  effect(name: string, context: AudioEffectContext = {}) {
    if (this.muted || !this.context || !this.master) {
      return
    }

    this.wake()
    const effectId = resolveAudioEffectId(name, context)

    if (effectId === undefined) {
      return
    }

    void this.loadManifest()
      .then(async (manifest) => {
        const effectKey = String(effectId)

        if (!(effectKey in manifest.effects) || this.muted || !this.context) {
          return
        }

        const entry = manifest.effects[effectKey]

        const buffer =
          this.buffers.get(effectId) ??
          (await this.loadEffectBuffer(effectId, entry))

        this.playEffectBuffer(buffer)
      })
      .catch(() => {
        this.swallowPlaybackError()
      })
  }
  toggle() {
    this.muted = !this.muted

    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(
        this.muted ? 0 : 0.6,
        this.context.currentTime,
        0.03,
      )
    }

    if (this.music) {
      if (this.muted) {
        this.music.volume = 0
      } else {
        this.music.volume = 0.48
      }

      if (!this.muted && this.active) {
        this.boot()
        this.playElement(this.music)
      }
    }
  }
  inspect() {
    return audioInspectSnapshot({
      currentId: this.currentId,
      manifest: this.manifest,
      music: this.music,
      buffers: this.buffers,
      voices: this.voices,
      muted: this.muted,
      context: this.context,
    })
  }
}
