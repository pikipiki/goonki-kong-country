import { useEffect, useState } from 'react'
import { AudioSystem } from '../game/audio'
import { Game } from '../game/engine'
import type { Controls } from '../game/input'
import {
  createAudioSystem,
  createControls,
  loadInitialGame,
} from './gameSession'
export function useGameSession(): {
  game: Game
  audio: AudioSystem
  controls: Controls
} {
  const [game] = useState(loadInitialGame)
  const [audio] = useState(createAudioSystem)
  const [controls] = useState(createControls)
  useEffect(() => {
    if (Object.getPrototypeOf(game) !== Game.prototype) {
      Object.setPrototypeOf(game, Game.prototype)
    }
  }, [game])
  useEffect(() => {
    if (Object.getPrototypeOf(audio) !== AudioSystem.prototype) {
      Object.setPrototypeOf(audio, AudioSystem.prototype)
    }
  }, [audio])
  return { game, audio, controls }
}
