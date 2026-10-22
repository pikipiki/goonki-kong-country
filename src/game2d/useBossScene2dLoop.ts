import { useEffect, type RefObject } from 'react'
import type { Game, Input } from '../game/engine'
import { loadBossScene2dAssets, type BossAssets } from './bossScene2dAssets'
import {
  stepBossScene2dFrame,
  type BossLoopState,
} from './bossScene2dFrameStep'
import { loadPlushAtlas, PlushSpriteRenderer } from './plushSprite'

export function useBossScene2dLoop(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  game: Game,
  input: Input,
  onTick: () => void,
) {
  useEffect(() => {
    let alive = true
    let raf = 0
    const plush = new PlushSpriteRenderer()
    void loadPlushAtlas().then((loaded) => {
      if (alive) {
        plush.setAtlas(loaded)
      }
    })
    const loopState: BossLoopState = {
      last: performance.now(),
      acc: 0,
      uiAcc: 0,
      assets: null as BossAssets | null,
      plush,
      cameraLeft: 0,
      cameraReady: false,
      cameraLift: 0,
      revision: game.sceneRevision,
    }
    void loadBossScene2dAssets()
      .then((loaded) => {
        if (alive) {
          loopState.assets = loaded
        }
      })
      .catch((err: unknown) => {
        console.error('[BossScene2D]', err)
      })
    const step = (now: number) => {
      if (!alive) {
        return
      }
      raf = requestAnimationFrame(step)
      const canvas = canvasRef.current
      if (!canvas) {
        return
      }
      stepBossScene2dFrame(canvas, game, input, onTick, loopState, now)
    }
    raf = requestAnimationFrame(step)
    return () => {
      alive = false
      cancelAnimationFrame(raf)
      plush.dispose()
    }
  }, [canvasRef, game, input, onTick])
}
