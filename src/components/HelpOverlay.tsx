import { useTranslation } from 'react-i18next'
import { Icon } from './chrome'

export function HelpOverlay({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="overlay help-overlay">
      <main className="panel help-panel">
        <button
          className="close-button"
          aria-label={t('helpClose')}
          onClick={onClose}
        >
          ×
        </button>
        <p className="eyebrow">{t('helpEyebrow')}</p>
        <h2>
          {t('helpTitle1')}
          <br />
          {t('helpTitle2')}
        </h2>
        <div className="help-rows">
          <p>
            <span>
              <kbd>←</kbd> <kbd>→</kbd> or <kbd>Q</kbd> <kbd>D</kbd>
            </span>
            {t('helpWalk')}
          </p>
          <p>
            <kbd>Space</kbd>
            {t('helpJumpSwim')}
          </p>
          <p>
            <kbd>Shift</kbd>
            {t('helpRun')}
          </p>
          <p>
            <kbd>X</kbd>
            {t('helpRollBarrel')}
          </p>
          <p>
            <kbd>C</kbd>
            {t('helpSwapMount')}
          </p>
          <p>
            <kbd>Esc</kbd>
            {t('helpPause')}
          </p>
        </div>
        <p className="panel-description">{t('helpBody')}</p>
        <p className="save-note">
          {t('helpGamepad')}
          <br />
          {t('helpMobile')}
        </p>
        <button className="primary" onClick={onClose}>
          {t('helpGo')}
          <Icon name="arrow" />
        </button>
      </main>
    </div>
  )
}
