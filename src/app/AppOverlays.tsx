import { HelpOverlay } from './HelpOverlay'
import { MAP_LEVELS } from './mapLevels'
import { MapOverlay } from './MapOverlay'
import { PhasePanel } from './PhasePanel'
import { PlayingHud } from './PlayingHud'
import { TitleIntro } from './TitleIntro'
import { ContextLostOverlay } from './ContextLostOverlay'
import { runPhasePrimaryAction } from './phasePrimaryAction'
import type { AppShell } from './useAppShell'
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
        shell.startDemo2D(6)
      }}
      unlocked={shell.game.save.unlocked}
    />
  )
}
function MapLayer({ shell }: { shell: AppShell }) {
  if (shell.phase !== 'map') {
    return null
  }
  return (
    <MapOverlay
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
      <MapLayer shell={shell} />
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
