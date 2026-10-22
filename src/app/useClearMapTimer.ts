import { useEffect } from 'react'
import type { Game, Phase } from '../game/engine'

export function useClearMapTimer(
  phase: Phase,
  game: Game,
  showClearedMap: () => void,
) {
  useEffect(() => {
    if (phase !== 'clear') {
      return
    }
    const timer = window.setTimeout(showClearedMap, 7200)
    return () => {
      window.clearTimeout(timer)
    }
  }, [phase, game.levelId, showClearedMap])
}
