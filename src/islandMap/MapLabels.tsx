import { resolveI18nKey } from '../i18n/resolveText'
import type { Destination } from './types'

export function MapLabels({
  positions,
  selected,
  unlocked,
  stages,
  onSelect,
}: {
  positions: { x: number; y: number }[]
  selected: number
  unlocked: number
  stages: Destination[]
  onSelect: (index: number) => void
}) {
  return (
    <div className="map-labels">
      {positions.map((position, index) => (
        <div
          className="map-label-anchor"
          key={index}
          style={{ left: position.x, top: position.y }}
        >
          <button
            type="button"
            className={`map-stage${index === selected ? ' selected' : ''}`}
            aria-label={`${String(index + 1).padStart(2, '0')}. ${resolveI18nKey(stages[index].name)}`}
            aria-pressed={index === selected}
            disabled={index > unlocked}
            onClick={() => {
              onSelect(index)
            }}
          >
            <span className="map-stage-number" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="map-stage-name">
              {resolveI18nKey(stages[index].name)}
            </span>
          </button>
        </div>
      ))}
    </div>
  )
}
