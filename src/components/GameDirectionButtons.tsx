import { useTranslation } from 'react-i18next'
import { controlFeedback } from './controlFeedback'
import { pick } from '../utils/pick'

export function GameDirectionButtons({
  clickMode,
  direction,
  steer,
  clear,
}: {
  clickMode: boolean
  direction: number
  steer: (next: number, running?: boolean) => void
  clear: () => void
}) {
  const { t } = useTranslation()

  const directionButton = (next: number) => (
    <button
      className={`direction-button ${pick(next < 0, 'left', 'right')} ${pick(direction === next, 'is-down', '')}`}
      aria-label={pick(next < 0, t('goLeft'), t('goRight'))}
      aria-pressed={direction === next}
      onPointerDown={(event) => {
        event.stopPropagation()
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        steer(pick(clickMode && direction === next, 0, next))
        controlFeedback()
      }}
      onPointerUp={() => {
        if (!clickMode) {
          clear()
        }
      }}
      onPointerCancel={clear}
      onLostPointerCapture={() => {
        if (!clickMode) {
          clear()
        }
      }}
      onClick={(event) => {
        if (event.detail === 0) {
          steer(pick(direction === next, 0, next))
        }
      }}
    >
      <span aria-hidden="true">{pick(next < 0, '◀', '▶')}</span>
    </button>
  )

  return (
    <>
      {directionButton(-1)}
      {directionButton(1)}
    </>
  )
}
