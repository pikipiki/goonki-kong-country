import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { FINAL_BOSS_STAGE_ID } from '../game/stageCatalog'
import type { Game, Input, Phase } from '../game/engine'
const Scene = lazy(() =>
  import('../Scene').then((module) => ({ default: module.Scene })),
)
const Scene2D = lazy(() =>
  import('../game2d/Scene2D').then((module) => ({ default: module.Scene2D })),
)
const BossScene2D = lazy(() =>
  import('../game2d/BossScene2D').then((module) => ({
    default: module.BossScene2D,
  })),
)

export function AppSceneContent({
  phase,
  demo2D,
  game,
  input,
  onTick,
}: {
  phase: Phase
  demo2D: boolean
  game: Game
  input: Input
  onTick: () => void
}) {
  const { t } = useTranslation()
  if (phase === 'map' || phase === 'clear' || (demo2D && phase === 'title'))
    return null
  let Renderer = Scene
  if (demo2D) {
    Renderer = game.levelId === FINAL_BOSS_STAGE_ID ? BossScene2D : Scene2D
  }
  return (
    <Suspense
      fallback={
        <div className="webgl-fallback" role="status">
          {t('loadingGame')}
        </div>
      }
    >
      <Renderer game={game} input={input} onTick={onTick} />
    </Suspense>
  )
}
