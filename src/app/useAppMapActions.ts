import { useCallback, useRef } from 'react'
import type { Game, Phase } from '../game/engine'
import { MAP_LEVELS } from './mapLevels'

export function useAppMapActions(
  game: Game,
  demo2D: boolean,
  mapMode2D: boolean,
  mapLevel: number,
  change: (action: () => void) => void,
  setMapLevel: (level: number) => void,
  setMapMode2D: (twoD: boolean) => void,
  setDemo2D: (demo: boolean) => void,
  start: (levelId?: number) => void,
  startDemo2D: (levelId?: number) => void,
) {
  const mapBack = useRef<Phase>('title')

  const selectMapLevel = useCallback(
    (levelId: number) => {
      setMapLevel(levelId)
      if (levelId !== 0 && levelId !== 6) {
        setMapMode2D(false)
      }
    },
    [setMapLevel, setMapMode2D],
  )

  const enterMapStage = useCallback(() => {
    const useDemo = mapMode2D && (mapLevel === 0 || mapLevel === 6)
    if (useDemo) {
      startDemo2D(mapLevel)
    } else {
      start(mapLevel)
    }
  }, [mapLevel, mapMode2D, start, startDemo2D])

  const openMap = useCallback(() => {
    change(() => {
      setMapLevel(game.levelId)
      setMapMode2D(demo2D && (game.levelId === 0 || game.levelId === 6))
      if (game.phase === 'title') {
        mapBack.current = 'title'
      } else {
        mapBack.current = 'paused'
      }
      game.phase = 'map'
    })
  }, [change, demo2D, game, setMapLevel, setMapMode2D])

  const showClearedMap = useCallback(() => {
    change(() => {
      const next = Math.min(MAP_LEVELS.length - 1, game.levelId + 1)
      setMapLevel(next)
      setMapMode2D(demo2D && (next === 0 || next === 6))
      mapBack.current = 'title'
      game.phase = 'map'
    })
  }, [change, demo2D, game, setMapLevel, setMapMode2D])

  return {
    mapBack,
    selectMapLevel,
    enterMapStage,
    openMap,
    showClearedMap,
  }
}
