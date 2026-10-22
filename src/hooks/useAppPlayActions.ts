import { isDemo2DStage, isOriginalStage } from '../game/stageCatalog'
import { useCallback } from 'react'
import { AudioSystem } from '../game/audio'
import type { Game } from '../game/engine'

export function useAppPlayActions(
  game: Game,
  audio: AudioSystem,
  change: (action: () => void) => void,
  setDemo2D: (demo: boolean) => void,
) {
  const start = useCallback(
    (levelId = 0) => {
      audio.boot()
      setDemo2D(false)
      change(() => {
        const tutorial = isOriginalStage(levelId)
        game.start(levelId, tutorial)
      })
    },
    [audio, change, game, setDemo2D],
  )

  const startDemo2D = useCallback(
    (levelId = 0) => {
      audio.boot()
      setDemo2D(true)
      change(() => {
        game.start(isDemo2DStage(levelId) ? levelId : 0, true)
      })
    },
    [audio, change, game, setDemo2D],
  )

  return { start, startDemo2D }
}
