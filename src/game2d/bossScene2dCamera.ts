import type { Game } from '../game/engine'
import { bossCameraLeft, bossViewport2D } from './camera2D'
import { SCENE2D_VIEWPORT_PAD_PX } from './scene2dConstants'
import { pick } from '../utils/pick'

export type BossSceneCamera = {
  cameraLeft: number
  cameraLift: number
  revision: number
}

export function updateBossScene2dCamera(
  game: Game,
  canvas: HTMLCanvasElement,
  state: BossSceneCamera,
  delta: number,
) {
  const rect = canvas.getBoundingClientRect()

  const aspect = rect.width / Math.max(1, rect.height)

  const viewport = bossViewport2D(rect.width, rect.height)

  const player = game.player

  const targetLeft = bossCameraLeft(
    player.x,
    viewport.worldWidth,
    game.level.length,
  )

  if (
    state.revision !== game.sceneRevision ||
    Math.abs(targetLeft - state.cameraLeft) > viewport.worldWidth
  ) {
    state.cameraLeft = targetLeft
    state.cameraLift = 0
    state.revision = game.sceneRevision
  }

  state.cameraLeft +=
    (targetLeft - state.cameraLeft) * (1 - Math.exp(-delta * 9))
  const scale = (viewport.width - SCENE2D_VIEWPORT_PAD_PX) / viewport.worldWidth

  const targetLift = Math.max(0, player.y - pick(viewport.portrait, 2.2, 1.2))

  state.cameraLift +=
    (targetLift - state.cameraLift) * (1 - Math.exp(-delta * 10))
  const floor = Math.round(
    viewport.height * pick(aspect >= 1.14, 0.65, 190 / 224) +
      state.cameraLift * scale,
  )

  const toCanvasX = (worldX: number) => 16 + (worldX - state.cameraLeft) * scale

  const toCanvasY = (worldY: number) => floor - worldY * scale

  game.cameraBounds = {
    x: state.cameraLeft + viewport.worldWidth / 2,
    y: (floor - viewport.height / 2) / scale,
    halfX: viewport.worldWidth / 2 + 1,
    halfY: viewport.height / scale / 2 + 1,
  }
  return {
    viewport,
    scale,
    floor,
    toCanvasX,
    toCanvasY,
    roomScale: (scale * 12) / 256,
    roomCentre: toCanvasX(game.level.length / 2),
  }
}
