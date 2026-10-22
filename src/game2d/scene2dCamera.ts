import { type Game } from '../game/engine'
import { clamp } from '../game/engine/math'
import {
  LEVEL_H,
  LEVEL_W,
  SCREEN_H,
  SCENE2D_JUNGLE_BASE_PY,
  SCENE2D_PIXELS_PER_WORLD,
} from './scene2dConstants'
export type Scene2dCamera = {
  camX: number
  camY: number
}

type ToPixel = (worldX: number, worldY: number) => { px: number; py: number }

export function updateScene2dCamera(
  game: Game,
  camera: Scene2dCamera,
  toPixel: ToPixel,
  screenW: number,
  screenH: number,
  deltaTime: number,
  isPortrait: boolean,
  isShortLandscape: boolean,
) {
  const playerPos = toPixel(game.player.x, game.player.y)

  if (game.bonus) {
    if (screenW < 256) {
      camera.camX = clamp(playerPos.px - screenW * 0.5, 0, 256 - screenW)
    } else {
      camera.camX = -Math.round((screenW - 256) * 0.5)
    }
    camera.camY = 32 - Math.round((screenH - SCREEN_H) * 0.5)
  } else {
    const lookAhead = game.player.facing * (isPortrait ? 22 : 28)

    let anchorX
    if (isPortrait) {
      anchorX = 0.5
    } else {
      anchorX = 0.44
    }

    let anchorY = 164

    if (isPortrait) {
      anchorY = Math.round(screenH * 0.68)
    } else if (isShortLandscape) {
      anchorY = Math.round(screenH * 0.65)
    }

    const targetX = clamp(
      playerPos.px + lookAhead - screenW * anchorX,
      0,
      LEVEL_W - screenW,
    )

    const targetY = clamp(playerPos.py - anchorY, 0, LEVEL_H - screenH)

    camera.camX += (targetX - camera.camX) * (1 - Math.exp(-deltaTime * 9))
    camera.camY += (targetY - camera.camY) * (1 - Math.exp(-deltaTime * 7))
  }

  game.cameraBounds = {
    x: (camera.camX + screenW * 0.5) / SCENE2D_PIXELS_PER_WORLD,
    y:
      (SCENE2D_JUNGLE_BASE_PY - (camera.camY + screenH * 0.5)) /
      SCENE2D_PIXELS_PER_WORLD,
    halfX: screenW / 64 + 6,
    halfY: screenH / 64 + 6,
  }
}
