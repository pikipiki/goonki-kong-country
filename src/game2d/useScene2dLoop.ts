import { simulation } from '../config/presentation.json'
import { useEffect, type RefObject } from 'react'
import { type Game, type Input, STEP } from '../game/engine'
import { jungleViewport2D } from './camera2D'
import { drawRomHud } from './drawRom2d'
import { type Assets2D, loadAssets2D } from './assets2d'
import { PlushSpriteRenderer, loadPlushAtlas } from './plushSprite'
import { renderBonusScene2d } from './renderBonusScene2d'
import { renderJungleBackdropScene2d } from './renderJungleBackdropScene2d'
import { renderJunglePlayfieldScene2d } from './renderJunglePlayfieldScene2d'
import { updateScene2dCamera } from './scene2dCamera'
import {
  createScene2dFxState,
  syncAndTickScene2dFx,
  resetScene2dFxState,
} from './scene2dFx'
import {
  toScenePixel,
  LEVEL_H,
  LEVEL_W,
  SCREEN_H,
  SCENE2D_JUNGLE_BASE_PY,
  SCENE2D_PIXELS_PER_WORLD,
} from './scene2dConstants'
import { createScene2dSpriteDrawer } from './scene2dSpriteDraw'
import { clamp } from '../game/engine/math'
export function useScene2dLoop(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  game: Game,
  input: Input,
  onTick: () => void,
) {
  useEffect(() => {
    return mountScene2dLoop(canvasRef, game, input, onTick)
  }, [canvasRef, game, input, onTick])
}

function prepareScene2dCanvas(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  rawW: number,
  rawH: number,
) {
  const viewport = jungleViewport2D(rawW, rawH)
  const screenW = viewport.width
  const screenH = viewport.height
  const canvas = canvasRef.current

  if (!canvas) {
    return null
  }

  if (canvas.width !== screenW || canvas.height !== screenH) {
    canvas.width = screenW
    canvas.height = screenH
  }

  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return null
  }

  ctx.imageSmoothingEnabled = false
  return { ctx, screenW, screenH }
}

export function paintScene2d(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  game: Game,
  assets: Assets2D | null,
  plushRenderer: PlushSpriteRenderer,
  fxState: ReturnType<typeof createScene2dFxState>,
  camera: { camX: number; camY: number },
  rawW: number,
  rawH: number,
  isPortrait: boolean,
  isShortLandscape: boolean,
  deltaTime: number,
) {
  const toPixel = (worldX: number, worldY: number) =>
    toScenePixel(game, worldX, worldY)

  syncAndTickScene2dFx(game, fxState, toPixel, deltaTime)

  const prepared = prepareScene2dCanvas(canvasRef, rawW, rawH)

  if (!prepared) {
    return
  }

  const { ctx, screenW, screenH } = prepared
  const aspect = rawW / Math.max(1, rawH)

  updateScene2dCamera(
    game,
    camera,
    toPixel,
    screenW,
    screenH,
    deltaTime,
    aspect < 0.95,
    aspect >= 0.95 && rawH <= 560,
  )

  const drawer = createScene2dSpriteDrawer(
    assets,
    camera.camX,
    camera.camY,
    screenW,
    screenH,
  )

  if (!assets) {
    ctx.fillStyle = '#1a0a14'
    ctx.fillRect(0, 0, screenW, screenH)
    return
  }

  if (game.bonus) {
    renderBonusScene2d(
      ctx,
      game,
      assets,
      camera.camX,
      camera.camY,
      screenW,
      screenH,
      plushRenderer,
      toPixel,
      drawer,
    )
    return
  }

  const jungleCtx = {
    game,
    assets,
    ctx,
    camX: camera.camX,
    camY: camera.camY,
    screenW,
    screenH,
    plushRenderer,
    toPixel,
    drawer,
    fxList: fxState.fxList,
  }

  renderJungleBackdropScene2d(jungleCtx)
  renderJunglePlayfieldScene2d(jungleCtx)

  if (game.phase === 'playing') {
    drawRomHud(ctx, assets, game, screenW, isPortrait)
  }
}

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
  if (state.nextUI > simulation.hudRefreshSeconds) {
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
