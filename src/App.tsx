import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { AppOverlays } from './app/AppOverlays'
import { AppSceneContent } from './app/AppSceneView'
import { AppTopBar } from './app/AppTopBar'
import { SceneBoundary } from './app/chrome'
import { sceneAriaLabel } from './app/sceneAriaLabel'
import { useAppShell } from './app/useAppShell'
export function App() {
  const { t } = useTranslation()
  const root = useRef<HTMLDivElement>(null)
  const shell = useAppShell()

  const fullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen()
      return
    }
    void root.current?.requestFullscreen().catch(() => {
      shell.game.message(t('fullscreenHint'))
    })
  }

  return (
    <div
      ref={root}
      className={`app phase-${shell.phase} ${shell.showControls ? 'has-controls' : ''} ${shell.demo2D ? 'demo-2d' : ''}`}
    >
      <div
        className="scene"
        aria-label={sceneAriaLabel(shell.phase, shell.demo2D)}
      >
        <SceneBoundary>
          <AppSceneContent
            phase={shell.phase}
            demo2D={shell.demo2D}
            game={shell.game}
            input={shell.controls.input}
            onTick={shell.tick}
          />
        </SceneBoundary>
      </div>
      <div className="vignette" />
      <div className="film-grain" />
      <AppTopBar
        shell={shell}
        onBrandHome={() => {
          shell.change(() => {
            shell.setDemo2D(false)
            shell.game.load(0, 'title')
          })
        }}
        onFullscreen={fullscreen}
      />
      <AppOverlays shell={shell} />
    </div>
  )
}
