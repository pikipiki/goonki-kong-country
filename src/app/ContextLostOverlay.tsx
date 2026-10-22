import { useTranslation } from 'react-i18next'

export function ContextLostOverlay() {
  const { t } = useTranslation()
  return (
    <div className="overlay">
      <main className="panel">
        <h2>{t('contextLostTitle')}</h2>
        <p>{t('contextLostBody')}</p>
        <button
          className="primary"
          onClick={() => {
            location.reload()
          }}
        >
          {t('reload')}
        </button>
      </main>
    </div>
  )
}
