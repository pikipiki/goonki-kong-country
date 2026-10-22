import type { RefObject } from 'react'
import { STEP, type Game, type Input } from '../game/engine'
import { clamp } from '../game/engine/math'
import { type Assets2D, loadAssets2D } from './assets2d'
import { loadPlushAtlas, PlushSpriteRenderer } from './plushSprite'
import { LEVEL_H, LEVEL_W, SCREEN_H } from './scene2dConstants'
import {
  SCENE2D_JUNGLE_BASE_PY,
  SCENE2D_PIXELS_PER_WORLD,
} from './scene2dWorldUnits'
import { createScene2dFxState, resetScene2dFxState } from './scene2dFx'
import { toScenePixel } from './scene2dPixel'
import { paintScene2d } from './useScene2dLoopPaint'

type Scene2dLoopState = {
  active: boolean
  assets: Assets2D | null
  plushRenderer: PlushSpriteRenderer
  lastTime: number
  accumulator: number
  nextUI: number
  camera: { camX: number; camY: number }
  lastRevision: number
  fxState: ReturnType<typeof createScene2dFxState>
}

function scene2dViewportSize(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const rect = canvasRef.current?.getBoundingClientRect()
  const rawW = rect && rect.width > 0 ? rect.width : window.innerWidth
  const rawH = rect && rect.height > 0 ? rect.height : window.innerHeight
  return { rawW, rawH, isPortrait: rawW / Math.max(1, rawH) < 0.95 }
}

function runScene2dFrame(
  now: number,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  game: Game,
  input: Input,
  onTick: () => void,
  state: Scene2dLoopState,
) {
  const deltaTime = Math.min((now - state.lastTime) / 1000, 0.1)
  state.lastTime = now

  if (game.phase === 'playing') {
    state.accumulator += deltaTime
    while (state.accumulator >= STEP) {
      game.update(input)
      state.accumulator -= STEP
    }
  }

  if (state.lastRevision !== game.sceneRevision) {
    state.lastRevision = game.sceneRevision
    resetScene2dFxState(state.fxState)
    const startPos = toScenePixel(game, game.player.x, game.player.y)
    state.camera.camX = clamp(startPos.px - 96, 0, LEVEL_W - 256)
    state.camera.camY = clamp(startPos.py - 168, 0, LEVEL_H - SCREEN_H)
  }

  const { rawW, rawH, isPortrait } = scene2dViewportSize(canvasRef)

  paintScene2d(
    canvasRef,
    game,
    state.assets,
    state.plushRenderer,
    state.fxState,
    state.camera,
    rawW,
    rawH,
    isPortrait,
    !isPortrait && rawH <= 560,
    deltaTime,
  )

  state.nextUI += deltaTime
  if (state.nextUI > 0.09) {
    state.nextUI = 0
    onTick()
  }
}

export function mountScene2dLoop(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  game: Game,
  input: Input,
  onTick: () => void,
) {
  const state: Scene2dLoopState = {
    active: true,
    assets: null,
    plushRenderer: new PlushSpriteRenderer(),
    lastTime: performance.now(),
    accumulator: 0,
    nextUI: 0,
    camera: {
      camX: Math.max(0, game.player.x * SCENE2D_PIXELS_PER_WORLD - 96),
      camY: clamp(
        SCENE2D_JUNGLE_BASE_PY - game.player.y * SCENE2D_PIXELS_PER_WORLD - 168,
        0,
        LEVEL_H - SCREEN_H,
      ),
    },
    lastRevision: game.sceneRevision,
    fxState: createScene2dFxState(),
  }

  void loadPlushAtlas().then((loaded) => {
    if (state.active) {
      state.plushRenderer.setAtlas(loaded)
    }
  })

  void loadAssets2D()
    .then((loaded) => {
      if (state.active) {
        state.assets = loaded
      }
    })
    .catch((err: unknown) => {
      console.error('[Scene2D] asset load error:', err)
    })

  let raf = 0
  const step = (now: number) => {
    if (!state.active) {
      return
    }
    raf = requestAnimationFrame(step)
    runScene2dFrame(now, canvasRef, game, input, onTick, state)
  }

  raf = requestAnimationFrame(step)
  return () => {
    state.active = false
    cancelAnimationFrame(raf)
    state.plushRenderer.dispose()
  }
}
