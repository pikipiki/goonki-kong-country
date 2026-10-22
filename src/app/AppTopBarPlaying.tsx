import { useTranslation } from 'react-i18next'
import type { Controls } from '../game/input'
import { pick } from '../utils/pick'
import { Icon } from './chrome'

export function AppTopBarPlaying({
  controls,
  showControls,
  setShowControls,
  onOpenMap,
  onPause,
}: {
  controls: Controls
  showControls: boolean
  setShowControls: (show: boolean) => void
  onOpenMap: () => void
  onPause: () => void
}) {
  const { t } = useTranslation()
  return (
    <>
      <button
        className="icon-button control-toggle"
        aria-label={pick(
          showControls,
          t('hideVirtualPad'),
          t('showVirtualPad'),
        )}
        title={t('virtualPad')}
        aria-pressed={showControls}
        onClick={() => {
          controls.reset()
          setShowControls(!showControls)
        }}
      >
        ✥
      </button>
      <button
        className="icon-button"
        aria-label={t('map')}
        title={t('map')}
        onClick={onOpenMap}
      >
        <Icon name="map" />
      </button>
      <button
        className="icon-button"
        aria-label={t('pauseGame')}
        onClick={onPause}
      >
        <Icon name="pause" />
      </button>
    </>
  )
}
