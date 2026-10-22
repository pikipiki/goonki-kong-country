import type { RefObject } from 'react'
import type { Game } from '../game/engine'
import { jungleViewport2D } from './camera2D'
import { drawRomHud } from './drawRom2d'
import type { Assets2D } from './assets2d'
import type { PlushSpriteRenderer } from './plushSprite'
import { renderBonusScene2d } from './renderBonusScene2d'
import { renderJungleBackdropScene2d } from './renderJungleBackdropScene2d'
import { renderJunglePlayfieldScene2d } from './renderJunglePlayfieldScene2d'
import { updateScene2dCamera } from './scene2dCamera'
import { createScene2dFxState, syncAndTickScene2dFx } from './scene2dFx'
import { toScenePixel } from './scene2dPixel'
import { createScene2dSpriteDrawer } from './scene2dSpriteDraw'

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
