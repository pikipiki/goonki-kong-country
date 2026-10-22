import { useEffect, type RefObject } from 'react'
import { STEP, type Game, type Input } from '../game/engine'
import type { BossBattle, BossProjectile } from '../game/bossBattle'
import { bossCameraLeft, bossViewport2D } from './camera2D'
import {
  updateBossScene2dCamera,
  type BossSceneCamera,
} from './bossScene2dCamera'
import { loadBossScene2dAssets, type BossAssets } from './bossScene2dAssets'
import { paintBossScene2dFrame } from './bossScene2dPaintFrame'
import { PlushSpriteRenderer } from './plushSprite'
function syncBossCanvasSize(canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect()
  const viewport = bossViewport2D(rect.width, rect.height)
  if (canvas.width !== viewport.width || canvas.height !== viewport.height) {
    canvas.width = viewport.width
    canvas.height = viewport.height
  }
  return viewport
}
function runBossScene2dFrame(
  canvas: HTMLCanvasElement,
  game: Game,
  input: Input,
  onTick: () => void,
  loopState: {
    assets: BossAssets | null
    plush: PlushSpriteRenderer
    camera: BossSceneCamera
    last: number
    acc: number
    uiAcc: number
  },
  now: number,
) {
  const delta = Math.min(0.1, (now - loopState.last) / 1000)
  loopState.last = now
  if (game.phase === 'playing') {
    loopState.acc += delta
    while (loopState.acc >= STEP) {
      game.update(input)
      loopState.acc -= STEP
    }
  } else {
    loopState.acc = 0
  }
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return
  }
  syncBossCanvasSize(canvas)
  ctx.imageSmoothingEnabled = false
  const view = game as Game & {
    bossBattle?: BossBattle | null
    bossProjectiles?: BossProjectile[]
  }
  const cam = updateBossScene2dCamera(game, canvas, loopState.camera, delta)
  paintBossScene2dFrame({
    ctx,
    game,
    assets: loopState.assets,
    plush: loopState.plush,
    width: cam.viewport.width,
    height: cam.viewport.height,
    floor: cam.floor,
    scale: cam.scale,
    roomCentre: cam.roomCentre,
    roomScale: cam.roomScale,
    toCanvasX: cam.toCanvasX,
    toCanvasY: cam.toCanvasY,
    bossBattle: view.bossBattle,
    bossProjectiles: view.bossProjectiles,
  })
  loopState.uiAcc += delta
  if (loopState.uiAcc > 0.09) {
    loopState.uiAcc = 0
    onTick()
  }
}

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
    const viewport = bossViewport2D(1, 1)
    const loopState = {
      assets: null as BossAssets | null,
      plush,
      camera: {
        cameraLeft: bossCameraLeft(
          game.player.x,
          viewport.worldWidth,
          game.level.length,
        ),
        cameraLift: 0,
        revision: game.sceneRevision,
      },
      last: performance.now(),
      acc: 0,
      uiAcc: 0,
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
      runBossScene2dFrame(canvas, game, input, onTick, loopState, now)
    }
    raf = requestAnimationFrame(step)
    return () => {
      alive = false
      cancelAnimationFrame(raf)
      plush.dispose()
    }
  }, [canvasRef, game, input, onTick])
}
