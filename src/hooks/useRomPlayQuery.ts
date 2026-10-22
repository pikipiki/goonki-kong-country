import { useEffect } from 'react'
import type { AudioSystem } from '../game/audio'
import type { Game } from '../game/engine'
import {
  applyDemoPlayQuery,
  applyRomPlayQuery,
  isDemo2DQuery,
  romRouteLevel,
} from '@lib/romPlayQuery'

export function useRomPlayQuery(
  game: Game,
  audio: AudioSystem,
  change: (action: () => void) => void,
  setDemo2D: (value: boolean) => void,
) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const mode2d = isDemo2DQuery(params)
    if (mode2d) {
      audio.boot()
      setDemo2D(true)
      change(() => {
        applyDemoPlayQuery(game, params)
      })
    } else if (romRouteLevel(params) !== null) {
      audio.boot()
      change(() => {
        applyRomPlayQuery(game, params)
      })
    }
  }, [audio, change, game, setDemo2D])
}
