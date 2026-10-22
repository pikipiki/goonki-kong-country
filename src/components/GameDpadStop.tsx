import { useTranslation } from 'react-i18next'

export function GameDpadStop({ onStop }: { onStop: () => void }) {
  const { t } = useTranslation()
  return (
    <>
      <button
        className="stop-button"
        aria-label={t('stopMove')}
        onPointerDown={(event) => {
          event.stopPropagation()
          onStop()
        }}
      >
        ■
      </button>
      <span className="direction-caption">{t('directionRun')}</span>
    </>
  )
}
