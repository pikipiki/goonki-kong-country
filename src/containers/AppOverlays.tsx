import { FINAL_BOSS_STAGE_ID } from '../game/stageCatalog'
import { ContextLostOverlay } from '@components/ContextLostOverlay'
import { HelpOverlay } from '@components/HelpOverlay'
import { PhasePanel } from '@components/PhasePanel'
import { PlayingHud } from '@components/PlayingHud'
import { TitleIntro } from '@components/TitleIntro'
import { MAP_LEVELS } from '@lib/mapLevels'
import { runPhasePrimaryAction } from '@lib/phasePrimaryAction'
import { type AppShell } from '@hooks/useAppShell'
import { lazy, Suspense } from 'react'

const MapOverlayLazy = lazy(() =>
  import('@components/MapOverlay').then((module) => ({
    default: module.MapOverlay,
  })),
)

function TitleLayer({ shell }: { shell: AppShell }) {
  if (shell.phase !== 'title') {
    return null
  }
  return (
    <TitleIntro
      onOpenMap={shell.mapActions.openMap}
      onContinue={() => {
        shell.start(shell.game.save.unlocked)
      }}
      onDemoJungle={() => {
        shell.startDemo2D(0)
      }}
      onDemoBoss={() => {
        shell.startDemo2D(FINAL_BOSS_STAGE_ID)
      }}
      unlocked={shell.game.save.unlocked > 0}
    />
  )
}

function MapLayer({ shell }: { shell: AppShell }) {
  if (shell.phase !== 'map') {
    return null
  }
  return (
    <MapOverlayLazy
      mapLevel={shell.mapLevel}
      gameLevelId={shell.game.levelId}
      demo2D={shell.demo2D}
      mapMode2D={shell.mapMode2D}
      stages={MAP_LEVELS}
      onHome={() => {
        shell.change(() => {
          shell.setDemo2D(false)
          shell.game.load(0, 'title')
        })
      }}
      onSelectLevel={shell.mapActions.selectMapLevel}
      onConfirmStage={shell.mapActions.enterMapStage}
      onMapMode2D={shell.setMapMode2D}
      onSound={(name) => {
        shell.audio.effect(name)
      }}
    />
  )
}

export function AppOverlays({ shell }: { shell: AppShell }) {
  return (
    <>
      <TitleLayer shell={shell} />
      {shell.phase === 'playing' && (
        <PlayingHud
          game={shell.game}
          controls={shell.controls}
          demo2D={shell.demo2D}
          showControls={shell.showControls}
        />
      )}
      <Suspense fallback={null}>
        <MapLayer shell={shell} />
      </Suspense>
      <PhasePanel
        phase={shell.phase}
        game={shell.game}
        onPrimary={() => {
          runPhasePrimaryAction(
            shell.phase,
            shell.demo2D,
            shell.game,
            shell.change,
            shell.start,
            shell.startDemo2D,
            shell.mapActions.showClearedMap,
          )
        }}
        onOpenMap={shell.mapActions.openMap}
      />
      {shell.help && (
        <HelpOverlay
          onClose={() => {
            shell.setHelp(false)
          }}
        />
      )}
      {shell.contextLost && <ContextLostOverlay />}
    </>
  )
}
