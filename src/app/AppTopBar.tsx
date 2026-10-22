import { useTranslation } from 'react-i18next'
import { LanguageSelect } from '../components/LanguageSelect'
import { resolveI18nKey } from '../i18n/resolveText'
import { AppTopBarPlaying } from './AppTopBarPlaying'
import { AppTopBarTools } from './AppTopBarTools'
import type { AppShell } from './useAppShell'

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
