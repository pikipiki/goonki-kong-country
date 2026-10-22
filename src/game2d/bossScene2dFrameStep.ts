import { STEP, type Game, type Input } from '../game/engine'
import type { BossBattle, BossProjectile } from '../game/bossBattle'
import { bossCameraLeft, bossViewport2D } from './camera2D'
import type { BossAssets } from './bossScene2dAssets'
import { paintBossScene2dFrame } from './bossScene2dPaintFrame'
import type { PlushSpriteRenderer } from './plushSprite'
import { SCENE2D_VIEWPORT_PAD_PX } from './scene2dConstants'
import { pick } from '../utils/pick'

export type BossLoopState = {
  last: number
  acc: number
  uiAcc: number
  assets: BossAssets | null
  plush: PlushSpriteRenderer
  cameraLeft: number
  cameraReady: boolean
  cameraLift: number
  revision: number
}

function tickBossSimulation(
  game: Game,
  input: Input,
  state: BossLoopState,
  delta: number,
) {
  if (game.phase === 'playing') {
    state.acc += delta

    while (state.acc >= STEP) {
      game.update(input)
      state.acc -= STEP
    }
  } else {
    state.acc = 0
  }
}

function syncBossCamera(
  game: Game,
  state: BossLoopState,
  targetLeft: number,
  worldWidth: number,
  delta: number,
) {
  if (
    !state.cameraReady ||
    state.revision !== game.sceneRevision ||
    Math.abs(targetLeft - state.cameraLeft) > worldWidth
  ) {
    state.cameraLeft = targetLeft
    state.cameraLift = 0
    state.revision = game.sceneRevision
    state.cameraReady = true
  } else {
    state.cameraLeft +=
      (targetLeft - state.cameraLeft) * (1 - Math.exp(-delta * 9))
  }
}

export function stepBossScene2dFrame(
  canvas: HTMLCanvasElement,
  game: Game,
  input: Input,
  onTick: () => void,
  state: BossLoopState,
  now: number,
) {
  const delta = Math.min(0.1, (now - state.last) / 1000)

  state.last = now
  tickBossSimulation(game, input, state, delta)

  const rect = canvas.getBoundingClientRect()

  const aspect = rect.width / Math.max(1, rect.height)

  const viewport = bossViewport2D(rect.width, rect.height)

  const viewWidth = viewport.width

  const viewHeight = viewport.height

  if (canvas.width !== viewWidth || canvas.height !== viewHeight) {
    canvas.width = viewWidth
    canvas.height = viewHeight
  }

  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return
  }

  ctx.imageSmoothingEnabled = false

  const player = game.player

  const targetLeft = bossCameraLeft(
    player.x,
    viewport.worldWidth,
    game.level.length,
  )

  syncBossCamera(game, state, targetLeft, viewport.worldWidth, delta)

  const scale = (viewWidth - SCENE2D_VIEWPORT_PAD_PX) / viewport.worldWidth

  const targetLift = Math.max(0, player.y - pick(viewport.portrait, 2.2, 1.2))

  state.cameraLift +=
    (targetLift - state.cameraLift) * (1 - Math.exp(-delta * 10))
  const floor = Math.round(
    viewHeight * pick(aspect >= 1.14, 0.65, 190 / 224) +
      state.cameraLift * scale,
  )

  const camLeft = state.cameraLeft

  const toCanvasX = (worldX: number) => 16 + (worldX - camLeft) * scale

  const toCanvasY = (worldY: number) => floor - worldY * scale

  game.cameraBounds = {
    x: camLeft + viewport.worldWidth / 2,
    y: (floor - viewHeight / 2) / scale,
    halfX: viewport.worldWidth / 2 + 1,
    halfY: viewHeight / scale / 2 + 1,
  }

  const view = game as Game & {
    bossBattle?: BossBattle | null
    bossProjectiles?: BossProjectile[]
  }

  paintBossScene2dFrame({
    ctx,
    game,
    assets: state.assets,
    plush: state.plush,
    width: viewWidth,
    height: viewHeight,
    floor,
    scale,
    roomCentre: toCanvasX(game.level.length / 2),
    roomScale: (scale * 12) / 256,
    toCanvasX,
    toCanvasY,
    bossBattle: view.bossBattle,
    bossProjectiles: view.bossProjectiles,
  })
  state.uiAcc += delta

  if (state.uiAcc > 0.09) {
    state.uiAcc = 0
    onTick()
  }
}
