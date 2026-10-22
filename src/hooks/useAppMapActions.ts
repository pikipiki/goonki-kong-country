import { isDemo2DStage } from '../game/stageCatalog'
import { useCallback, useRef } from 'react'
import type { Game, Phase } from '../game/engine'
import { MAP_LEVELS } from '@lib/mapLevels'

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
      if (!isDemo2DStage(levelId)) {
        setMapMode2D(false)
      }
    },
    [setMapLevel, setMapMode2D],
  )

  const enterMapStage = useCallback(() => {
    const useDemo = mapMode2D && isDemo2DStage(mapLevel)
    if (useDemo) {
      startDemo2D(mapLevel)
    } else {
      start(mapLevel)
    }
  }, [mapLevel, mapMode2D, start, startDemo2D])

  const openMap = useCallback(() => {
    change(() => {
      setMapLevel(game.levelId)
      setMapMode2D(demo2D && isDemo2DStage(game.levelId))
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
      setMapMode2D(demo2D && isDemo2DStage(next))
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
