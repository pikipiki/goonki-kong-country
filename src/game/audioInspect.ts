import type { AudioManifest } from './audioMusicIds'

export function audioInspectSnapshot(state: {
  currentId: number
  manifest?: AudioManifest
  music?: HTMLAudioElement
  buffers: Map<number, AudioBuffer>
  voices: Set<AudioBufferSourceNode>
  muted: boolean
  context?: AudioContext
}) {
  return {
    trackId: state.currentId,
    trackName: state.manifest?.music[String(state.currentId)]?.name,
    currentTime: state.music?.currentTime ?? 0,
    playing: !!state.music && !state.music.paused,
    loadedEffects: state.buffers.size,
    effectsState: state.context?.state ?? 'uninitialized',
    activeVoices: state.voices.size,
    muted: state.muted,
    manifestLoaded: !!state.manifest,
  }
}
