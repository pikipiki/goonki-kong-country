import { useTranslation } from 'react-i18next'
import type { AudioSystem } from '../game/audio'
import { pick } from '../utils/pick'
import { Icon } from './chrome'

export function AppTopBarTools({
  muted,
  audio,
  setMuted,
  onFullscreen,
  showHelp,
  onShowHelp,
}: {
  muted: boolean
  audio: AudioSystem
  setMuted: (value: boolean) => void
  onFullscreen: () => void
  showHelp: boolean
  onShowHelp: () => void
}) {
  const { t } = useTranslation()

  return (
    <>
      <button
        className="icon-button"
        aria-label={pick(muted, t('soundOn'), t('soundOff'))}
        title={pick(muted, t('soundOn'), t('soundOff'))}
        onClick={() => {
          audio.boot()
          audio.toggle()
          setMuted(audio.muted)
        }}
      >
        <Icon name={pick(muted, 'mute', 'sound')} />
      </button>
      <button
        className="icon-button fullscreen"
        aria-label={t('fullscreen')}
        title={t('fullscreen')}
        onClick={onFullscreen}
      >
        <Icon name="expand" />
      </button>
      {showHelp && (
        <button className="text-button" onClick={onShowHelp}>
          {t('howToPlay')} <span>↗</span>
        </button>
      )}
    </>
  )
}
