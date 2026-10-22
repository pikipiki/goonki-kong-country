import { useEffect } from 'react'
import { AudioSystem } from '../game/audio'
import type { Game, Phase } from '../game/engine'
import { resolveAudioScene } from './audioSceneId'

export function useAppAudioPhase(game: Game, audio: AudioSystem, phase: Phase) {
  const audioScene = resolveAudioScene(game)
  useEffect(() => {
    if (phase === 'playing') {
      audio.play(audioScene)
    } else if (
      phase === 'title' ||
      phase === 'map' ||
      phase === 'clear' ||
      phase === 'victory' ||
      phase === 'gameover'
    ) {
      audio.play(phase)
    } else {
      audio.stop()
    }
    return () => {
      audio.stop()
    }
  }, [phase, audio, game.levelId, audioScene])
}
