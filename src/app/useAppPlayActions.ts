import { useCallback } from 'react'
import { AudioSystem } from '../game/audio'
import type { Game } from '../game/engine'
import { pick } from '../utils/pick'

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
        const tutorial =
          levelId === 0 || levelId === 1 || levelId === 2 || levelId === 3
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
        game.start(pick(levelId === 6, 6, 0), true)
      })
    },
    [audio, change, game, setDemo2D],
  )

  return { start, startDemo2D }
}
