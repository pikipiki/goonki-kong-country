import { useTranslation } from 'react-i18next'
import type { Key } from '../game/engine'
import type { Controls } from '../game/input'
import { pick } from '../utils/pick'

export function GameSwimButtons({
  controls,
  clickMode,
}: {
  controls: Controls
  clickMode: boolean
}) {
  const { t } = useTranslation()

  const swimButton = (key: Key) => (
    <button
      key={key}
      className={`swim-direction swim-${key}`}
      aria-label={pick(key === 'up', t('swimUp'), t('swimDown'))}
      onPointerDown={(event) => {
        event.stopPropagation()
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        const held = controls.input.held.has(key)
        controls.set(
          `virtual-${pick(key === 'up', 'down', 'up')}`,
          pick(key === 'up', 'down', 'up'),
          false,
        )
        controls.set(`virtual-${key}`, key, pick(clickMode, !held, true))
      }}
      onPointerUp={() => {
        if (!clickMode) {
          controls.set(`virtual-${key}`, key, false)
        }
      }}
      onLostPointerCapture={() => {
        if (!clickMode) {
          controls.set(`virtual-${key}`, key, false)
        }
      }}
      onPointerCancel={() => {
        controls.set(`virtual-${key}`, key, false)
      }}
      onClick={(event) => {
        if (event.detail === 0) {
          controls.set(`virtual-${key}`, key, !controls.input.held.has(key))
        }
      }}
    >
      {pick(key === 'up', '▲', '▼')}
    </button>
  )

  return (
    <>
      {swimButton('up')}
      {swimButton('down')}
    </>
  )
}
