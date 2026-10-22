import { lazy, Suspense, type ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import { FINAL_BOSS_STAGE_ID } from '../game/stageCatalog'
import type { Game, Input, Phase } from '../game/engine'

type SceneRendererProps = {
  game: Game
  input: Input
  onTick: () => void
}

function lazyWithRetry<T extends ComponentType<SceneRendererProps>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      const module = await factory()
      try {
        sessionStorage.removeItem('goonk_chunk_reload')
      } catch {
        // ignore storage errors
      }
      return module
    } catch (error) {
      try {
        const hasReloaded = sessionStorage.getItem('goonk_chunk_reload')
        if (!hasReloaded) {
          sessionStorage.setItem('goonk_chunk_reload', 'true')
          window.location.reload()
        }
      } catch {
        // ignore storage errors
      }
      throw error
    }
  })
}

const Scene = lazyWithRetry(() =>
  import('../Scene').then((module) => ({ default: module.Scene })),
)
const Scene2D = lazyWithRetry(() =>
  import('../game2d/Scene2D').then((module) => ({ default: module.Scene2D })),
)
const BossScene2D = lazyWithRetry(() =>
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
