import { flow } from '../config/presentation.json'
import { type Game, type Phase } from '../game/engine'
import { type Controls } from '../game/input'
import { AudioSystem } from '../game/audio'
import { useAppAudioPhase, useAppWakeAudio } from './useAppAudioPhase'
import { useAppGameBindings } from './useAppGameBindings'
import { useAppInspectSurface } from './useAppInspectSurface'
import { useAppTouchGuards } from './useAppTouchGuards'
import { useGameInputBindings } from './useGameInputBindings'
import { useRomPlayQuery } from './useRomPlayQuery'
import { useEffect } from 'react'
export function useAppLifecycle(
  game: Game,
  audio: AudioSystem,
  controls: Controls,
  phase: Phase,
  change: (action: () => void) => void,
  tick: () => void,
  setMapLevel: (level: number) => void,
  setContextLost: (lost: boolean) => void,
  setShowControls: (show: boolean) => void,
  setDemo2D: (demo: boolean) => void,
  showClearedMap: () => void,
) {
  useAppWakeAudio(audio)
  useAppGameBindings(game, audio)
  useAppAudioPhase(game, audio, phase)
  useClearMapTimer(phase, game, showClearedMap)
  useGameInputBindings(
    game,
    controls,
    change,
    tick,
    setMapLevel,
    setContextLost,
    setShowControls,
  )
  useAppTouchGuards()
  useRomPlayQuery(game, audio, change, setDemo2D)
  useAppInspectSurface(game, audio)
}

export function useClearMapTimer(
  phase: Phase,
  game: Game,
  showClearedMap: () => void,
) {
  useEffect(() => {
    if (phase !== 'clear') {
      return
    }
    const timer = window.setTimeout(
      showClearedMap,
      flow.clearMapDelayMilliseconds,
    )
    return () => {
      window.clearTimeout(timer)
    }
  }, [phase, game.levelId, showClearedMap])
}
