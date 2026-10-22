import { AudioSystem } from '../game/audio'
import { Game, readSave } from '../game/engine'
import { Controls } from '../game/input'

export const SAVE_STORAGE_KEY = 'goonk-country-v1'
export function loadInitialGame(): Game {
  let saved: string | null = null
  try {
    saved = localStorage.getItem(SAVE_STORAGE_KEY)
  } catch {
    saved = null
  }
  return new Game(readSave(saved))
}

export function createAudioSystem(): AudioSystem {
  return new AudioSystem()
}

export function createControls(): Controls {
  return new Controls()
}
