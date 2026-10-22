import { useTranslation } from 'react-i18next'

export function TitleIntroDemo({
  onDemoJungle,
  onDemoBoss,
}: {
  onDemoJungle: () => void
  onDemoBoss: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="demo-2d-choices">
      <p>{t('demo2DIncludes')}</p>
      <div>
        <button className="secondary demo-2d-button" onClick={onDemoJungle}>
          {t('demo2DJungle')}
        </button>
        <button className="secondary demo-2d-button" onClick={onDemoBoss}>
          {t('demo2DBoss')}
        </button>
      </div>
    </div>
  )
}
