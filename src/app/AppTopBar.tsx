import { useTranslation } from 'react-i18next'
import { LanguageSelect } from '../components/LanguageSelect'
import { resolveI18nKey } from '../i18n/resolveText'
import { type AppShell } from './useAppShell'
import { type Controls } from '../game/input'
import { Icon } from './chrome'
import { type AudioSystem } from '../game/audio'
export function AppTopBar({
  shell,
  onBrandHome,
  onFullscreen,
}: {
  shell: AppShell
  onBrandHome: () => void
  onFullscreen: () => void
}) {
  const { t } = useTranslation()
  const {
    phase,
    game,
    controls,
    audio,
    muted,
    setMuted,
    showControls,
    setShowControls,
  } = shell

  return (
    <header className="topbar">
      <button
        className="brand"
        onClick={onBrandHome}
        aria-label={t('brandHome')}
      >
        <span className="brand-mark">g.</span>
        <span>
          GOONK<span className="brand-sub">COUNTRY</span>
        </span>
      </button>
      {phase === 'playing' && (
        <div className="stage-name">
          <span>{String(game.levelId + 1).padStart(2, '0')} / 07</span>
          {resolveI18nKey(game.level.name)}
        </div>
      )}
      <nav className="top-actions" aria-label={t('gameOptions')}>
        <LanguageSelect />
        {phase === 'playing' && (
          <AppTopBarPlaying
            controls={controls}
            showControls={showControls}
            setShowControls={setShowControls}
            onOpenMap={shell.mapActions.openMap}
            onPause={() => {
              shell.change(() => {
                game.pause()
              })
            }}
          />
        )}
        <AppTopBarTools
          muted={muted}
          audio={audio}
          setMuted={setMuted}
          onFullscreen={onFullscreen}
          showHelp={phase !== 'playing'}
          onShowHelp={() => {
            shell.setHelp(true)
          }}
        />
      </nav>
    </header>
  )
}

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
        aria-label={showControls ? t('hideVirtualPad') : t('showVirtualPad')}
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
        aria-label={muted ? t('soundOn') : t('soundOff')}
        title={muted ? t('soundOn') : t('soundOff')}
        onClick={() => {
          audio.boot()
          audio.toggle()
          setMuted(audio.muted)
        }}
      >
        <Icon name={muted ? 'mute' : 'sound'} />
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
