import { useEffect } from 'react'
import { AudioSystem } from '../game/audio'
import { type Game, type Phase } from '../game/engine'
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

export function useAppWakeAudio(audio: AudioSystem) {
  useEffect(() => {
    const wake = () => {
      audio.wake()
    }
    window.addEventListener('pointerdown', wake, true)
    window.addEventListener('keydown', wake, true)
    return () => {
      window.removeEventListener('pointerdown', wake, true)
      window.removeEventListener('keydown', wake, true)
    }
  }, [audio])
}

export function resolveAudioScene(game: Game): string {
  if (game.bonus) {
    return 'bonus'
  }
  if (game.level.originalTerrain === 'cave') {
    return 'cave'
  }
  return game.level.biome
}
