export type AudioMusic = {
  id: number
  name: string
  url: string
  seconds: number
  loop: {
    startSeconds: number
    endSeconds: number
    samplePerfect: boolean
  } | null
}

export type AudioEffect = {
  id: number
  name: string
  url: string
  seconds: number
}

export type AudioManifest = {
  music: Record<string, AudioMusic>
  effects: Record<string, AudioEffect>
  provenance: unknown
}

export const AUDIO_MUSIC_IDS: Record<string, number> = {
  title: 9,
  map: 12,
  jungle: 0,
  cave: 1,
  canopy: 19,
  mine: 4,
  lagoon: 3,
  snow: 5,
  temple: 6,
  ship: 24,
  bonus: 16,
  clear: 26,
  gameover: 15,
  victory: 14,
}

export const AUDIO_ONCE_EFFECT_IDS = new Set([10, 15, 17, 18, 25, 26])
