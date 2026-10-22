import { useTranslation } from 'react-i18next'
import { localeKeys } from '../i18n/keys'
import { resolveI18nKey } from '../i18n/resolveText'
import { Icon, Portrait } from './chrome'
import { TitleIntroDemo } from './TitleIntroDemo'
import { pick } from '../utils/pick'

export function TitleIntro({
  onOpenMap,
  onContinue,
  onDemoJungle,
  onDemoBoss,
  unlocked,
}: {
  onOpenMap: () => void
  onContinue: () => void
  onDemoJungle: () => void
  onDemoBoss: () => void
  unlocked: boolean
}) {
  const { t } = useTranslation()
  return (
    <>
      <main className="intro">
        <div className="intro-copy">
          <p className="eyebrow">
            <span /> {t('eyebrowIsland')}
          </p>
          <h1>
            GOONK
            <span>
              Country<span className="title-dot">.</span>
            </span>
          </h1>
          <p className="intro-description">
            {t('tagline1')}
            <br />
            {t('tagline2')}
          </p>
          <div className="intro-cta">
            <button
              className="primary explore-primary"
              onClick={onOpenMap}
              autoFocus
            >
              {t('map')}
              <Icon name="arrow" />
            </button>
            <button className="secondary" onClick={onContinue}>
              {t(pick(unlocked, 'continue', 'play'))}
            </button>
            <TitleIntroDemo
              onDemoJungle={onDemoJungle}
              onDemoBoss={onDemoBoss}
            />
          </div>
          <div className="duo-note">
            <div className="portraits">
              <Portrait small />
              <Portrait pink={false} small />
            </div>
            <p>
              {t('roseViolet')}
              <span>{t('neverApart')}</span>
            </p>
          </div>
        </div>
        <span className="character-note pink-note">
          {resolveI18nKey(localeKeys.buddies.rose)}
          <span>{t('roseTitle')}</span>
        </span>
        <span className="character-note violet-note">
          {resolveI18nKey(localeKeys.buddies.violet)}
          <span>{t('violetTitle')}</span>
        </span>
      </main>
      <footer className="intro-footer">
        <span>{t('footerTagline')}</span>
        <span>
          {t('footerInput')} <span className="key-outline">↵</span>
        </span>
      </footer>
    </>
  )
}
