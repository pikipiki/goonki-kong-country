import { isDemo2DQuery } from './romPlayQuery'
import { useCallback, useState } from 'react'
import { type Game, type Phase } from '../game/engine'
import { type Controls } from '../game/input'
import { AudioSystem } from '../game/audio'
import { useAppLifecycle } from './useAppLifecycle'
import { useAppMapActions } from './useAppMapActions'
import { useAppPlayActions } from './useAppPlayActions'
import { useGameSession } from './useGameSession'
export type AppShell = {
  phase: Phase
  game: Game
  audio: AudioSystem
  controls: Controls
  demo2D: boolean
  mapLevel: number
  mapMode2D: boolean
  muted: boolean
  setMuted: (muted: boolean) => void
  help: boolean
  setHelp: (show: boolean) => void
  contextLost: boolean
  showControls: boolean
  setShowControls: (show: boolean) => void
  change: (action: () => void) => void
  start: (levelId?: number) => void
  startDemo2D: (levelId?: number) => void
  mapActions: ReturnType<typeof useAppMapActions>
  tick: () => void
  setDemo2D: (demo: boolean) => void
  setMapMode2D: (twoD: boolean) => void
}
function useAppUiState() {
  const [mapLevel, setMapLevel] = useState(0)
  const [demo2D, setDemo2D] = useState(() =>
    isDemo2DQuery(new URLSearchParams(window.location.search)),
  )
  const [mapMode2D, setMapMode2D] = useState(false)
  const [muted, setMuted] = useState(false)
  const [help, setHelp] = useState(false)
  const [contextLost, setContextLost] = useState(false)
  const [showControls, setShowControls] = useState(
    () =>
      window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 900,
  )
  return {
    mapLevel,
    setMapLevel,
    demo2D,
    setDemo2D,
    mapMode2D,
    setMapMode2D,
    muted,
    setMuted,
    help,
    setHelp,
    contextLost,
    setContextLost,
    showControls,
    setShowControls,
  }
}

export function useAppShell(): AppShell {
  const { game, audio, controls } = useGameSession()
  const view = useAppUiState()
  const [, render] = useState(0)
  const tick = useCallback(() => {
    render((frame) => frame + 1)
  }, [])
  const phase = game.phase
  const change = useCallback(
    (action: () => void) => {
      controls.reset()
      action()
      tick()
    },
    [controls, tick],
  )
  const { start, startDemo2D } = useAppPlayActions(
    game,
    audio,
    change,
    view.setDemo2D,
  )
  const mapActions = useAppMapActions(
    game,
    view.demo2D,
    view.mapMode2D,
    view.mapLevel,
    change,
    view.setMapLevel,
    view.setMapMode2D,
    view.setDemo2D,
    start,
    startDemo2D,
  )
  useAppLifecycle(
    game,
    audio,
    controls,
    phase,
    change,
    tick,
    view.setMapLevel,
    view.setContextLost,
    view.setShowControls,
    view.setDemo2D,
    mapActions.showClearedMap,
  )
  return {
    phase,
    game,
    audio,
    controls,
    demo2D: view.demo2D,
    mapLevel: view.mapLevel,
    mapMode2D: view.mapMode2D,
    muted: view.muted,
    setMuted: view.setMuted,
    help: view.help,
    setHelp: view.setHelp,
    contextLost: view.contextLost,
    showControls: view.showControls,
    setShowControls: view.setShowControls,
    change,
    start,
    startDemo2D,
    mapActions,
    tick,
    setDemo2D: view.setDemo2D,
    setMapMode2D: view.setMapMode2D,
  }
}
