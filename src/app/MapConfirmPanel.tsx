import { useTranslation } from 'react-i18next'
import type { Level } from '../game/levels'
import { resolveI18nKey } from '../i18n/resolveText'
import { Icon } from './chrome'

export function MapConfirmPanel({
  mapLevel,
  mapMode2D,
  stages,
  onMapMode2D,
  onConfirmStage,
}: {
  mapLevel: number
  mapMode2D: boolean
  stages: Level[]
  onMapMode2D: (twoD: boolean) => void
  onConfirmStage: () => void
}) {
  const { t } = useTranslation()
  let map2dHintKey
  if (mapLevel === 0 || mapLevel === 6) {
    map2dHintKey = 'map2DAvailable'
  } else {
    map2dHintKey = 'map2DUnavailable'
  }

  return (
    <div className="map-confirm">
      <p className="map-selection" aria-live="polite" aria-atomic="true">
        <span>{resolveI18nKey(stages[mapLevel].subtitle)}</span>
        <strong>{resolveI18nKey(stages[mapLevel].name)}</strong>
      </p>
      <fieldset className="map-render-mode">
        <legend>{t('mapView')}</legend>
        <div className="map-mode-buttons">
          <button
            type="button"
            aria-pressed={!mapMode2D}
            onClick={() => {
              onMapMode2D(false)
            }}
          >
            3D
          </button>
          <button
            type="button"
            aria-pressed={mapMode2D}
            disabled={mapLevel !== 0 && mapLevel !== 6}
            onClick={() => {
              onMapMode2D(true)
            }}
          >
            2D
          </button>
        </div>
        <span>{t(map2dHintKey)}</span>
      </fieldset>
      <button className="primary map-enter" onClick={onConfirmStage}>
        {t('mapEnter')} <Icon name="arrow" />
      </button>
    </div>
  )
}
