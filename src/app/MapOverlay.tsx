import { useTranslation } from 'react-i18next'
import { LEVELS, type Level } from '../game/levels'
import { IslandMap } from '../IslandMap'
import { Icon } from './chrome'
import { MapConfirmPanel } from './MapConfirmPanel'

export function MapOverlay({
  mapLevel,
  gameLevelId,
  demo2D,
  mapMode2D,
  stages,
  onHome,
  onSelectLevel,
  onConfirmStage,
  onMapMode2D,
  onSound,
}: {
  mapLevel: number
  gameLevelId: number
  demo2D: boolean
  mapMode2D: boolean
  stages: Level[]
  onHome: () => void
  onSelectLevel: (id: number) => void
  onConfirmStage: () => void
  onMapMode2D: (twoD: boolean) => void
  onSound: (name: string) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="overlay map-overlay">
      <div className="map-shell">
        <button className="back-link" aria-label={t('home')} onClick={onHome}>
          <Icon name="back" />
          {t('home')}
        </button>
        <div className="map-heading">
          <p className="eyebrow">{t('eyebrowIsland')}</p>
          <h2>
            {t('mapTitle')}
            <span>.</span>
          </h2>
          <p id="map-instructions" className="panel-description">
            {t('mapInstructions')}
          </p>
        </div>
        <IslandMap
          selected={mapLevel}
          initial={gameLevelId}
          unlocked={LEVELS.length - 1}
          onSelect={onSelectLevel}
          onConfirm={onConfirmStage}
          stages={stages}
          mode2D={demo2D}
          onSound={onSound}
        />
        <MapConfirmPanel
          mapLevel={mapLevel}
          mapMode2D={mapMode2D}
          stages={stages}
          onMapMode2D={onMapMode2D}
          onConfirmStage={onConfirmStage}
        />
      </div>
    </div>
  )
}
