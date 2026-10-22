import { useTranslation } from 'react-i18next'

export function PlayingHudKeyboardHint() {
  const { t } = useTranslation()
  return (
    <div className="keyboard-hint">
      <span>
        <kbd>←</kbd>
        <kbd>→</kbd> {t('hintMove')}
      </span>
      <span>
        <kbd>Space</kbd> {t('hintJump')}
      </span>
      <span>
        <kbd>X</kbd> {t('hintRoll')}
      </span>
      <span>
        <kbd>C</kbd> {t('hintSwap')}
      </span>
      <span>
        <kbd>⇧</kbd> {t('hintRun')}
      </span>
    </div>
  )
}
