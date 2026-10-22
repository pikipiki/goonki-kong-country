import type { Game, Phase } from '../game/engine'
import type { Controls } from '../game/input'
import { AudioSystem } from '../game/audio'
import { useAppAudioPhase } from './useAppAudioPhase'
import { useAppGameBindings } from './useAppGameBindings'
import { useAppInspectSurface } from './useAppInspectSurface'
import { useAppTouchGuards } from './useAppTouchGuards'
import { useAppWakeAudio } from './useAppWakeAudio'
import { useClearMapTimer } from './useClearMapTimer'
import { useGameInputBindings } from './useGameInputBindings'
import { useRomPlayQuery } from './useRomPlayQuery'

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
